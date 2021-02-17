import 'mocha';
import * as webdriverio from 'webdriverio';
const sync = require('@wdio/sync').default;
import * as wdio from '@wdio/sync';
import * as express from 'express';
import * as sinon from 'sinon';
import * as chromedriver from 'chromedriver';
import isCI = require('is-ci');
import testListen = require('test-listen');
import delay from 'delay';
import { assert } from 'chai';
import * as path from 'path';
import { Server, createServer } from 'http';
import * as net from 'net';
import * as fs from 'fs';
import AxeBuilder from '.';
import { logOrRethrowError } from './utils';

const connectToChromeDriver = (port: number): Promise<void> => {
  let socket: net.Socket;
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line prefer-const

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

describe('@axe-core/webdriverio', () => {
  const port = 9515;
  before(async () => {
    chromedriver.start([`--port=${port}`]);
    await delay(500);
    await connectToChromeDriver(port);
  });

  after(() => {
    chromedriver.stop();
  });

  describe('WebdriverIO Async', () => {
    let server: Server;
    let addr: string;
    let client: webdriverio.BrowserObject;

    beforeEach(async () => {
      const app = express();
      let binaryPath;
      app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
      server = createServer(app);
      addr = await testListen(server);
      if (
        fs.existsSync(`C:/Program Files/Google/Chrome/Application/chrome.exe`)
      ) {
        binaryPath = `C:/Program Files/Google/Chrome/Application/chrome.exe`;
      }
      // Only run headless on CI. This makes it a bit easier to debug
      // tests (because we can inspect the browser's devtools).
      const chromeArgs = isCI ? ['--headless', '--no-sandbox'] : [];

      const options: webdriverio.RemoteOptions = {
        port,
        path: '/',
        services: ['chromedriver'],
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: chromeArgs,
            binary: binaryPath
          }
        },
        logLevel: 'error'
      };

      client = await webdriverio.remote(options);
    });

    afterEach(async () => {
      await client.deleteSession();
      server.close();
    });
    describe('AxeBuilder', () => {
      it('throws a useful error when not given a valid client', () => {
        assert.throws(
          () => new AxeBuilder({ client: () => 'foobar' } as any),
          /An instantiated webdriverio client of v5 or v6 is required/
        );
      });

      describe('analyze', () => {
        it('returns results', async () => {
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client }).analyze();
          assert.isNotNull(results);
          assert.isArray(results.violations);
          assert.isArray(results.incomplete);
          assert.isArray(results.passes);
          assert.isArray(results.inapplicable);
        });
      });

      describe('disableFrame', () => {
        it('does not inject into disabled frames', async () => {
          await client.url(`${addr}/recursive-frames.html`);
          const executeSpy = sinon.spy(client, 'execute');
          await new AxeBuilder({ client })
            .disableFrame('[src*="recursive.html"]')
            .analyze();
          assert.strictEqual(executeSpy.callCount, 2);
        });

        it('does not error when disabled frame does not exist', async () => {
          await client.url(`${addr}/recursive-frames.html`);
          const executeSpy = sinon.spy(client, 'execute');
          await new AxeBuilder({ client })
            .disableFrame('[src*="does-not-exist.html"]')
            .analyze();
          assert.strictEqual(executeSpy.callCount, 5);
        });
      });

      describe('disableRules', () => {
        it('disables the given rules(s) as array', async () => {
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
        it('injects into nested frames', async () => {
          await client.url(`${addr}/nested-frames.html`);
          const executeSpy = sinon.spy(client, 'execute');
          await new AxeBuilder({ client }).analyze();
          /**
           * Ensure we called execute 4 times
           * 1. nested-frames.html
           * 2. foo.html
           * 3. bar.html
           * 4. baz.html
           */
          assert.strictEqual(executeSpy.callCount, 4);
        });
      });

      describe('logOrRethrowError', () => {
        it('log a StaleElementReference Error with `seleniumStack`', () => {
          const error = {
            seleniumStack: {
              type: 'StaleElementReference'
            }
          };
          assert.doesNotThrow(() => logOrRethrowError(error as any));
        });

        it('log a `stale element reference` Error', () => {
          const error = {
            name: 'stale element reference',
            message: 'foobar'
          };
          assert.doesNotThrow(() => logOrRethrowError(error));
        });

        it('throws errors that are not StaleElementReferenceErrors', () => {
          const error = {
            name: 'foo',
            message: 'bar'
          };
          assert.throws(() => logOrRethrowError(error));
        });
      });

      describe('withRules', () => {
        it('only runs the provided rules as an array', async () => {
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client })
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
          await client.url(`${addr}/context.html`);
          const builder = new AxeBuilder({ client })
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
          await client.url(`${addr}/context.html`);
          const builder = new AxeBuilder({ client }).include('.include');

          try {
            await builder.analyze();
          } catch (e) {
            error = e;
          }

          assert.strictEqual(error, null);
        });

        it('wth only exclude', async () => {
          let error: Error | null = null;
          await client.url(`${addr}/context.html`);
          const builder = new AxeBuilder({ client }).exclude('.exclude');

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
          await client.url(`${addr}/index.html`);
          new AxeBuilder({ client }).analyze((err, results) => {
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
  });

  describe('WebdriverIO Sync', () => {
    let server: Server;
    let addr: string;
    let remote: any;

    beforeEach(async () => {
      const app = express();
      let binaryPath = '';
      app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
      server = createServer(app);
      addr = await testListen(server);
      if (
        fs.existsSync(`C:/Program Files/Google/Chrome/Application/chrome.exe`)
      ) {
        binaryPath = `C:/Program Files/Google/Chrome/Application/chrome.exe`;
      }
      // Only run headless on CI. This makes it a bit easier to debug
      // tests (because we can inspect the browser's devtools).
      const chromeArgs = isCI ? ['--headless', '--no-sandbox'] : [];

      const options: webdriverio.RemoteOptions = {
        port,
        path: '/',
        services: ['chromedriver'],
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: chromeArgs,
            binary: binaryPath
          }
        },
        logLevel: 'error'
      };

      remote = webdriverio.remote(options);
    });

    afterEach(function (done) {
      remote
        .then((client: wdio.BrowserObject) =>
          sync(() => {
            client.deleteSession();
            server.close();
          })
        )
        .then(() => done())
        .catch((e: Error) => done(e));
    });

    it('analyze', function (done) {
      remote
        .then((client: wdio.BrowserObject) =>
          sync(() => {
            client.url(`${addr}/index.html`);
            new AxeBuilder({ client }).analyze((error, results) => {
              assert.isNotNull(results);
              assert.isArray(results?.violations);
              assert.isArray(results?.incomplete);
              assert.isArray(results?.passes);
              assert.isArray(results?.inapplicable);
            });
          })
        )
        .then(() => done())
        .catch((e: Error) => done(e));
    });
  });
});
