import 'mocha';
import type { WebDriver } from 'selenium-webdriver';
import * as express from 'express';
import * as sinon from 'sinon';
import * as chromedriver from 'chromedriver';
import testListen = require('test-listen');
import delay from 'delay';
import { assert } from 'chai';
import * as path from 'path';
import { Server, createServer } from 'http';
import * as net from 'net';
const json = require('./fixtures/custom-rule-config.json');
import Webdriver from './run-webdriver';
import AxeBuilder from '../';

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
  before(async () => {
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
  });

  describe('configure', () => {
    it('should find configured violations in all iframes', async () => {
      await driver.get(`${addr}/outer-configure-iframe.html`);
      const results = await new AxeBuilder(driver)
        .options({
          rules: {
            'landmark-one-main': { enabled: false },
            'page-has-heading-one': { enabled: false },
            region: { enabled: false },
            'html-lang-valid': { enabled: false },
            bypass: { enabled: false }
          }
        })
        .configure(json)
        .analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a iframe
      assert.equal(results.violations[0].nodes.length, 2);
    });

    it('should not find violations in iframes prohibited by allowedOrigins', async () => {
      const config = {
        ...json,
        allowedOrigins: ['http://not-our-iframe.example.com']
      };

      await driver.get(`${addr}/outer-configure-iframe.html`);
      const results = await new AxeBuilder(driver)
        .options({
          rules: {
            'landmark-one-main': { enabled: false },
            'page-has-heading-one': { enabled: false },
            region: { enabled: false },
            'html-lang-valid': { enabled: false },
            bypass: { enabled: false }
          }
        })
        .configure(config)
        .analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // There is a second violation in a iframe which we should miss
      assert.equal(results.violations[0].nodes.length, 1);
    });

    it('should find configured violations in all frames', async () => {
      await driver.get(`${addr}/outer-configure-frame.html`);
      const results = await new AxeBuilder(driver)
        .options({
          rules: {
            'landmark-one-main': { enabled: false },
            'page-has-heading-one': { enabled: false },
            region: { enabled: false },
            'html-lang-valid': { enabled: false },
            bypass: { enabled: false }
          }
        })
        .configure(json)
        .analyze();

      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a frame
      assert.equal(results.violations[0].nodes.length, 2);
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

  describe('iframe tests', () => {
    it('injects into nested iframes', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const executeSpy = sinon.spy(driver, 'executeScript');
      await new AxeBuilder(driver).analyze();
      /**
       * Ensure we called execute 4 times
       * 1. nested-iframes.html
       * 2. iframes/foo.html
       * 3. iframes/bar.html
       * 4. iframes/baz.html
       */
      assert.strictEqual(executeSpy.callCount, 4);
    });
  });

  describe('frame tests', () => {
    it('injects into nested frames', async () => {
      await driver.get(`${addr}/nested-frames.html`);
      const executeSpy = sinon.spy(driver, 'executeScript');
      await new AxeBuilder(driver).analyze();
      /**
       * Ensure we called execute 4 times
       * 1. nested-frames.html
       * 2. frames/foo.html
       * 3. frames/bar.html
       * 4. frames/baz.html
       */
      assert.strictEqual(executeSpy.callCount, 4);
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

    it('wth only exclude', async () => {
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
    it('returns results when callback is provided', async () => {
      await driver.get(`${addr}/index.html`);
      new AxeBuilder(driver).analyze((err, results) => {
        if (err) {
          // Something _should_ happen with error
        }
        assert.isNotNull(results);
        assert.isArray(results?.violations);
        assert.isArray(results?.incomplete);
        assert.isArray(results?.passes);
        assert.isArray(results?.inapplicable);
      });
    });
  });
});
