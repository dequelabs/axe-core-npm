import 'mocha';
import { AxeResults, Spec } from 'axe-core';
import { WebDriver } from 'selenium-webdriver';
import * as express from 'express';
import * as chromedriver from 'chromedriver';
import testListen = require('test-listen');
import delay from 'delay';
import { assert } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import { Server, createServer } from 'http';
import { Webdriver, connectToChromeDriver } from './test-utils';
import AxeBuilder from '../src';
const dylangConfig = require('./fixtures/external/dylang-config.json') as Spec;

describe('@axe-core/webdriverjs', () => {
  const port = 9515;
  let driver: WebDriver;
  let server: Server;
  let addr: string;
  let axeSource: string;
  let axeCrasherSource: string;
  let axeForceLegacy: string;

  before(async () => {
    const axePath = require.resolve('axe-core');
    axeSource = fs.readFileSync(axePath, 'utf8');
    const externalPath = path.resolve(__dirname, 'fixtures', 'external');
    axeCrasherSource = fs.readFileSync(
      path.join(externalPath, 'axe-crasher.js'),
      'utf8'
    );
    axeForceLegacy = fs.readFileSync(
      path.join(externalPath, 'axe-force-legacy.js'),
      'utf8'
    );

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
      await driver.get(`${addr}/external/index.html`);
      const results = await new AxeBuilder(driver).analyze();
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('returns correct results metadata', async () => {
      await driver.get(`${addr}/index.html`);
      const results = await new AxeBuilder(driver).analyze();
      assert.isDefined(results.testEngine.name);
      assert.isDefined(results.testEngine.version);
      assert.isDefined(results.testEnvironment.orientationAngle);
      assert.isDefined(results.testEnvironment.orientationType);
      assert.isDefined(results.testEnvironment.userAgent);
      assert.isDefined(results.testEnvironment.windowHeight);
      assert.isDefined(results.testEnvironment.windowWidth);
      assert.isDefined(results.testRunner.name);
      assert.isDefined(results.toolOptions.reporter);
      assert.equal(results.url, `${addr}/index.html`);
    });

    it('properly isolates the call to axe.finishRun', async () => {
      let err;
      await driver.get(`${addr}/external/isolated-finish.html`);
      try {
        await new AxeBuilder(driver).analyze();
      } catch (e) {
        err = e;
      }
      assert.isUndefined(err);
    });

    it('throws if axe errors out on the top window', done => {
      driver
        .get(`${addr}/external/crash.html`)
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
        .get(`${addr}/external/crash-me.html`)
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
        .get(`${addr}/external/index.html`)
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
      await driver.get(`${addr}/external/nested-iframes.html`);
      const results = await new AxeBuilder(driver)
        .configure(dylangConfig)
        .analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a iframe
      assert.equal(results.violations[0].nodes.length, 8);
    });

    it('should find configured violations in all framesets', async () => {
      await driver.get(`${addr}/external/nested-frameset.html`);
      const results = await new AxeBuilder(driver)
        .configure(dylangConfig)
        .analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a frame
      assert.equal(results.violations[0].nodes.length, 8);
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
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/nested-iframes.html`);
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
      await driver.get(`${addr}/external/nested-frameset.html`);
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
      await driver.get(`${addr}/external/shadow-frames.html`);
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
      await driver.get(`${addr}/external/crash-parent.html`);
      const results = await new AxeBuilder(driver, axeSource + axeCrasherSource)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.deepEqual(results.incomplete[0].nodes[0].target, ['#ifr-crash']);
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

    it('returns the same results from runPartial as from legacy mode', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const legacyResults = await new AxeBuilder(
        driver,
        axeSource + axeForceLegacy
      ).analyze();
      assert.equal(legacyResults.testEngine.name, 'axe-legacy');

      const normalResults = await new AxeBuilder(driver, axeSource).analyze();
      normalResults.timestamp = legacyResults.timestamp;
      normalResults.testEngine.name = legacyResults.testEngine.name;
      assert.deepEqual(normalResults, legacyResults);
    });
  });

  describe('withRules', () => {
    it('only runs the provided rules as an array', async () => {
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/index.html`);
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
      await driver.get(`${addr}/external/index.html`);
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
    const flatPassesTargets = (results: AxeResults): string[] => {
      return results.passes
        .reduce((acc, pass) => {
          return acc.concat(pass.nodes as any);
        }, [])
        .reduce((acc, node: any) => {
          return acc.concat(node.target);
        }, []);
    };
    it('with include and exclude', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .include('.include')
        .exclude('.exclude');
      const results = await builder.analyze();

      assert.isTrue(flatPassesTargets(results).includes('.include'));
      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
    });

    it('with only include', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver).include('.include');
      const results = await builder.analyze();

      assert.isTrue(flatPassesTargets(results).includes('.include'));
    });

    it('with only exclude', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver).exclude('.exclude');
      const results = await builder.analyze();

      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
    });

    it('with chaining only include', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .include('.include')
        .include('.include2');
      const results = await builder.analyze();

      assert.isTrue(flatPassesTargets(results).includes('.include'));
      assert.isTrue(flatPassesTargets(results).includes('.include2'));
    });

    it('with chaining only exclude', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .exclude('.exclude')
        .exclude('.exclude2');
      const results = await builder.analyze();

      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
      assert.isFalse(flatPassesTargets(results).includes('.exclude2'));
    });

    it('with chaining include and exclude', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .include('.include')
        .include('.include2')
        .exclude('.exclude')
        .exclude('.exclude2');
      const results = await builder.analyze();

      assert.isTrue(flatPassesTargets(results).includes('.include'));
      assert.isTrue(flatPassesTargets(results).includes('.include2'));
      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
      assert.isFalse(flatPassesTargets(results).includes('.exclude2'));
    });

    it('with include and exclude iframe selectors with no violations', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .include(['#ifr-one', 'html'])
        .exclude(['#ifr-one', 'main'])
        .exclude(['#ifr-one', 'img']);

      const results = await builder.analyze();

      assert.lengthOf(results.violations, 0);
    });

    it('with include and exclude iframe selectors with violations', async () => {
      await driver.get(`${addr}/context.html`);
      const builder = new AxeBuilder(driver)
        .include(['#ifr-one', 'html'])
        .exclude(['#ifr-one', 'main']);
      const results = await builder.analyze();

      assert.lengthOf(results.violations, 2);
      assert.strictEqual(results.violations[0].id, 'image-alt');
      assert.strictEqual(results.violations[1].id, 'region');
    });
  });

  describe('callback()', () => {
    it('returns an error as the first argument', done => {
      driver.get(`${addr}/external/index.html`).then(() => {
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
      driver.get(`${addr}/external/index.html`).then(() => {
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

  describe('axe.finishRun errors', () => {
    const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;
    const windowOpenThrows = `;window.open = () => { throw new Error("No window.open")}`;

    it('throws an error if window.open throws', async () => {
      const source = axeSource + windowOpenThrows;
      await driver.get(`${addr}/external/index.html`);

      try {
        await new AxeBuilder(driver, source).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /switchTo failed./);
      }
    });

    it('throws an error if axe.finishRun throws', async () => {
      const source = axeSource + finishRunThrows;
      await driver.get(`${addr}/external/index.html`);

      try {
        await new AxeBuilder(driver, source).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /Please check out/);
      }
    });
  });

  describe('setLegacyMode', () => {
    const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
    it('runs legacy mode when used', async () => {
      await driver.get(`${addr}/external/index.html`);
      const results = await new AxeBuilder(driver, axeSource + runPartialThrows)
        .setLegacyMode()
        .analyze();
      assert.isNotNull(results);
    });

    it('prevents cross-origin frame testing', async () => {
      await driver.get(`${addr}/external/cross-origin.html`);
      const results = await new AxeBuilder(driver, axeSource + runPartialThrows)
        .withRules(['frame-tested'])
        .setLegacyMode()
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );
      assert.ok(frameTested);
    });

    it('can be disabled again', async () => {
      await driver.get(`${addr}/external/cross-origin.html`);
      const results = await new AxeBuilder(driver)
        .withRules(['frame-tested'])
        .setLegacyMode()
        .setLegacyMode(false)
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );
      assert.isUndefined(frameTested);
    });
  });

  describe('for versions without axe.runPartial', () => {
    let axe403Source: string;
    before(() => {
      const axe403Path = path.resolve(
        __dirname,
        'fixtures',
        'external',
        'axe-core@legacy.js'
      );
      axe403Source = fs.readFileSync(axe403Path, 'utf8');
    });

    it('can run', async () => {
      await driver.get(`${addr}/external/nested-iframes.html`);
      const results = await new AxeBuilder(driver, axe403Source)
        .options({ runOnly: ['label'] })
        .analyze();

      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 4);
      assert.equal(results.testEngine.version, '4.0.3');
    });

    it('throws if the top level errors', done => {
      driver
        .get(`${addr}/external/crash.html`)
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
      await driver.get(`${addr}/external/nested-iframes.html`);
      const results = await new AxeBuilder(driver, axe403Source)
        .configure(dylangConfig)
        .analyze();
      assert.equal(results.violations[0].id, 'dylang');
      assert.equal(results.violations[0].nodes.length, 8);
    });

    it('reports frame-tested', async () => {
      await driver.get(`${addr}/external/crash-parent.html`);
      const results = await new AxeBuilder(
        driver,
        axe403Source + axeCrasherSource
      )
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();
      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });

    it('tests cross-origin pages', async () => {
      await driver.get(`${addr}/external/cross-origin.html`);
      const results = await new AxeBuilder(driver, axe403Source)
        .withRules(['frame-tested'])
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );
      assert.isUndefined(frameTested);
    });
  });
});
