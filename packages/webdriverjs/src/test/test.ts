import 'mocha';
import { Spec } from 'axe-core';
import { WebDriver } from 'selenium-webdriver';
import * as express from 'express';
import * as chromedriver from 'chromedriver';
import testListen = require('test-listen');
import delay from 'delay';
import { assert } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import { Server, createServer } from 'http';
import * as net from 'net';
import Webdriver from './run-webdriver';
import AxeBuilder from '../';
const json = require('./fixtures/custom-rule-config.json') as Spec;

const connectToChromeDriver = (port: number): Promise<void> => {
  let socket: net.Socket;
  return new Promise((resolve, reject) => {
    // Give up after 1s
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Unable to connect to ChromeDriver'));
    }, 1000);

    const connectionListener = (): void => {
      clearTimeout(timer);
      socket.destroy();
      return resolve();
    };

    socket = net.createConnection(
      { host: 'localhost', port },
      connectionListener
    );

    // Fail on error
    socket.once('error', (err: Error) => {
      clearTimeout(timer);
      socket.destroy();
      return reject(err);
    });
  });
};

describe('@axe-core/webdriverjs', () => {
  const port = 9515;
  let driver: WebDriver;
  let server: Server;
  let addr: string;
  let axeSource: string;
  let axeCrasherSource: string;

  before(async () => {
    const axePath = require.resolve('axe-core');
    axeSource = fs.readFileSync(axePath, 'utf8');
    const axeCrashPath = path.resolve(__dirname, './fixtures/axe-crasher.js');
    axeCrasherSource = fs.readFileSync(axeCrashPath, 'utf8');

    chromedriver.start([`--port=${port}`]);
    await delay(500);
    await connectToChromeDriver(port);
  });

  after(() => {
    chromedriver.stop();
  });

  beforeEach(async () => {
    const app = express();
    app.use(express.static(path.resolve(__dirname, 'fixtures')));
    server = createServer(app);
    addr = await testListen(server);
    driver = Webdriver();
  });

  afterEach(async () => {
    await driver.close();
    server.close();
  });

  describe('analyze', () => {
    it('returns results', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver).analyze();
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('throws if axe errors out on the top window', done => {
      driver
        .get(`${addr}/crash-me.html`)
        .then(() => {
          return new AxeBuilder(driver, axeSource + axeCrasherSource).analyze();
        })
        .then(
          () => done(new Error('Expect async function to throw')),
          () => done()
        );
    });

    it('throws when injecting a problematic source', done => {
      driver
        .get(`${addr}/crash-me.html`)
        .then(() => {
          return new AxeBuilder(driver, 'throw new Error()').analyze();
        })
        .then(
          () => done(new Error('Expect async function to throw')),
          () => done()
        );
    });

    it('throws when a setup fails', done => {
      const brokenSource = axeSource + `;window.axe.utils = {}`;
      driver
        .get(`${addr}/index.html`)
        .then(() => {
          return new AxeBuilder(driver, brokenSource)
            .withRules('label')
            .analyze();
        })
        .then(
          () => done(new Error(`Expect async function to throw`)),
          () => done()
        );
    });
  });

  describe('configure', () => {
    it('should find configured violations in all iframes', async () => {
      await driver.get(`${addr}/outer-configure-iframe.html`);
      const results = await new AxeBuilder(driver).configure(json).analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a iframe
      assert.equal(results.violations[0].nodes.length, 2);
    });

    it('should find configured violations in all frames', async () => {
      await driver.get(`${addr}/outer-configure-frame.html`);
      const results = await new AxeBuilder(driver).configure(json).analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a frame
      assert.equal(results.violations[0].nodes.length, 2);
    });

    it('throws when passed a non-object', () => {
      assert.throws(() => {
        /* @ts-expect-error */
        new AxeBuilder(driver, axe403Source).configure('abc123');
      });
    });
  });

  describe('disableRules', () => {
    it('disables the given rules(s) as array', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .disableRules(['region'])
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.isTrue(!all.find(r => r.id === 'region'));
    });

    it('disables the given rules(s) as string', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .disableRules('region')
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.isTrue(!all.find(r => r.id === 'region'));
    });
  });

  describe('frame tests', () => {
    it('injects into nested iframes', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const { violations } = await new AxeBuilder(driver)
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(violations[0].id, 'label');
      const nodes = violations[0].nodes;
      assert.lengthOf(nodes, 4);
      assert.deepEqual(nodes[0].target, [
        '#ifr-foo',
        '#foo-bar',
        '#bar-baz',
        'input'
      ]);
      assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
    });

    it('injects into nested frameset', async () => {
      await driver.get(`${addr}/nested-frameset.html`);
      const { violations } = await new AxeBuilder(driver)
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(violations[0].id, 'label');
      assert.lengthOf(violations[0].nodes, 4);

      const nodes = violations[0].nodes;
      assert.deepEqual(nodes[0].target, [
        '#frm-foo',
        '#foo-bar',
        '#bar-baz',
        'input'
      ]);
      assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
    });

    it('should work on shadow DOM iframes', async () => {
      await driver.get(`${addr}/shadow-iframes.html`);
      const { violations } = await new AxeBuilder(driver)
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(violations[0].id, 'label');
      assert.lengthOf(violations[0].nodes, 3);

      const nodes = violations[0].nodes;
      assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
      assert.deepEqual(nodes[1].target, [
        ['#shadow-root', '#shadow-frame'],
        'input'
      ]);
      assert.deepEqual(nodes[2].target, ['#slotted-frame', 'input']);
    });

    it('reports erroring frames in frame-tested', async () => {
      await driver.get(`${addr}/crash-me-parent.html`);
      const results = await new AxeBuilder(driver, axeSource + axeCrasherSource)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.deepEqual(results.incomplete[0].nodes[0].target, [
        '#ifr-crash-me'
      ]);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
      assert.deepEqual(results.violations[0].nodes[0].target, [
        '#ifr-bar',
        '#bar-baz',
        'input'
      ]);
      assert.deepEqual(results.violations[0].nodes[1].target, [
        '#ifr-baz',
        'input'
      ]);
    });
  });

  describe('withRules', () => {
    it('only runs the provided rules as an array', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .withRules(['region'])
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0].id, 'region');
    });

    it('only runs the provided rules as a string', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .withRules('region')
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0].id, 'region');
    });
  });

  describe('options', () => {
    it('passes options to axe-core', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .options({ rules: { region: { enabled: false } } })
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.isTrue(!all.find(r => r.id === 'region'));
    });
  });

  describe('withTags', () => {
    it('only rules rules with the given tag(s) as an array', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .withTags(['best-practice'])
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.isOk(all);
      for (const rule of all) {
        assert.include(rule.tags, 'best-practice');
      }
    });

    it('only rules rules with the given tag(s) as a string', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .withTags('best-practice')
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.isOk(all);
      for (const rule of all) {
        assert.include(rule.tags, 'best-practice');
      }
    });

    it('No results provided when the given tag(s) is invalid', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver)
        .withTags(['foobar'])
        .analyze();

      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      // Ensure all run rules had the "foobar" tag
      assert.deepStrictEqual(0, all.length);
    });
  });

  describe('include/exclude', () => {
    it('with include and exclude', async () => {
      let error: Error | null = null;
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .include('.include')
        .exclude('.exclude');

      try {
        await builder.analyze();
      } catch (e) {
        error = e;
      }

      assert.strictEqual(error, null);
    });

    it('with only include', async () => {
      let error: Error | null = null;
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver).include('.include');

      try {
        await builder.analyze();
      } catch (e) {
        error = e;
      }

      assert.strictEqual(error, null);
    });

    it('with only exclude', async () => {
      let error: Error | null = null;
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver).exclude('.exclude');

      try {
        await builder.analyze();
      } catch (e) {
        error = e;
      }

      assert.strictEqual(error, null);
    });
  });

  describe('callback()', () => {
    it('returns an error as the first argument', done => {
      driver.get(`${addr}/index.html`).then(() => {
        new AxeBuilder(driver, 'throw new Error()').analyze((err, results) => {
          try {
            assert.isNull(results);
            assert.isNotNull(err);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });

    it('returns as the second argument', done => {
      driver.get(`${addr}/index.html`).then(() => {
        new AxeBuilder(driver).analyze((err, results) => {
          try {
            assert.isNull(err);
            assert.isNotNull(results);
            assert.isArray(results?.violations);
            assert.isArray(results?.incomplete);
            assert.isArray(results?.passes);
            assert.isArray(results?.inapplicable);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  describe('for versions without axe.runPartial', () => {
    let axe403Source: string;
    before(() => {
      const axe403Path = path.resolve(
        __dirname,
        './fixtures/axe-core-4.0.3.js'
      );
      axe403Source = fs.readFileSync(axe403Path, 'utf8');
    });

    it('can run', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const results = await new AxeBuilder(driver, axe403Source)
        .options({ runOnly: ['label'] })
        .analyze();

      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 4);
      assert.equal(results.testEngine.version, '4.0.3');
    });

    it('throws if the top level errors', done => {
      driver
        .get(`${addr}/crash-me.html`)
        .then(() => {
          return new AxeBuilder(
            driver,
            axe403Source + axeCrasherSource
          ).analyze();
        })
        .then(
          () => done(new Error('Expect async function to throw')),
          () => done()
        );
    });

    it('can be configured', async () => {
      await driver.get(`${addr}/outer-configure-iframe.html`);
      const results = await new AxeBuilder(driver, axe403Source)
        .configure(json)
        .analyze();
      assert.equal(results.violations[0].id, 'dylang');
      assert.equal(results.violations[0].nodes.length, 2);
    });

    it('reports frame-tested', async () => {
      await driver.get(`${addr}/crash-me-parent.html`);
      const results = await new AxeBuilder(driver, axe403Source + axeCrasherSource)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });
  });
});
