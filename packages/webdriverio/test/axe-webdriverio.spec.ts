import * as webdriverio from 'webdriverio';
import express from 'express';
import listen from 'async-listen';
import { assert } from 'chai';
import chromedriver from 'chromedriver';
import path from 'path';
import { Server, createServer } from 'http';
import net from 'net';
import fs from 'fs';
import delay from 'delay';
import { AxeBuilder } from '../src';
import { logOrRethrowError } from '../src/utils';
import type { AxeResults, Result } from 'axe-core';
import child_process from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { fixturesPath } from 'axe-test-fixtures';

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
  let port: number;
  for (const protocol of ['devtools', 'webdriver'] as const) {
    if (protocol === 'webdriver') {
      port = 9515;

      let chromedriverProcess: ChildProcessWithoutNullStreams;

      before(async () => {
        const path = process.env.CHROMEDRIVER_PATH ?? chromedriver.path;
        chromedriverProcess = child_process.spawn(path, [`--port=${port}`]);
        chromedriverProcess.stdout.pipe(process.stdout);
        chromedriverProcess.stderr.pipe(process.stderr);
        await delay(500);
        await connectToChromeDriver(port);
      });

      after(() => {
        chromedriverProcess.kill();
      });
    }

    describe(`WebdriverIO Async (${protocol} protocol)`, () => {
      let server: Server;
      let addr: string;
      let client: WebdriverIO.Browser;
      const axePath = require.resolve('axe-core');
      const axeSource = fs.readFileSync(axePath, 'utf8');
      const axeLegacySource = fs.readFileSync(
        path.resolve(fixturesPath, 'axe-core@legacy.js'),
        'utf-8'
      );
      const axeCrasherSource = fs.readFileSync(
        path.join(fixturesPath, 'axe-crasher.js'),
        'utf8'
      );
      const axeForceLegacy = fs.readFileSync(
        path.join(fixturesPath, 'axe-force-legacy.js'),
        'utf8'
      );
      const axeLargePartial = fs.readFileSync(
        path.join(fixturesPath, 'axe-large-partial.js'),
        'utf8'
      );

      beforeEach(async () => {
        const app = express();
        let binaryPath;
        app.use(express.static(fixturesPath));
        server = createServer(app);
        // async-listen adds trailing forward slash,
        // this removes the unnecessary trailing forward slash
        addr = (await listen(server)).toString().replace(/\/$/, '');
        if (
          fs.existsSync(`C:/Program Files/Google/Chrome/Application/chrome.exe`)
        ) {
          binaryPath = `C:/Program Files/Google/Chrome/Application/chrome.exe`;
        }

        const options: webdriverio.RemoteOptions = {
          path: '/',
          automationProtocol: protocol,
          capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
              args: ['--headless'],
              binary: binaryPath
            }
          },
          logLevel: 'error'
        };

        client = await webdriverio.remote(
          protocol === 'webdriver'
            ? { ...options, port, hostname: 'localhost' }
            : options
        );
      });

      afterEach(async () => {
        await client.deleteSession();
        server.close();
      });
      describe('AxeBuilder', () => {
        if (protocol === 'devtools') {
          it('check to make sure that client is running devtools protocol', () => {
            assert.isTrue(client.isDevTools);
          });
        }

        if (protocol === 'webdriver') {
          it('check to make sure that client is running webdriver protocol', () => {
            // there is no `isWebdriver` option
            assert.isUndefined(client.isDevTools);
          });
        }

        it('throws a useful error when not given a valid client', () => {
          assert.throws(
            () => new AxeBuilder({ client: 'invalid' } as any),
            /An instantiated WebdriverIO client greater than v5 is required/
          );
        });

        it('throws a useful error when client does not have execute function', () => {
          assert.throws(
            () => new AxeBuilder({ client: { switchToFrame() {} } } as any),
            /An instantiated WebdriverIO client greater than v5 is required/
          );
        });

        it('throws a useful error when client does not have switchToFrame function', () => {
          assert.throws(
            () => new AxeBuilder({ client: { execute() {} } } as any),
            /An instantiated WebdriverIO client greater than v5 is required/
          );
        });

        it('does not throw when client is valid', () => {
          assert.doesNotThrow(
            () =>
              new AxeBuilder({
                client: {
                  execute() {},
                  switchToFrame() {}
                }
              } as any)
          );
        });

        it('allows client to be a function (@wdio/globals)', () => {
          const client = () => {};
          client.execute = () => {};
          client.switchToFrame = () => {};

          assert.doesNotThrow(() => new AxeBuilder({ client } as any));
        });

        describe('errorUrl', () => {
          it('returns correct errorUrl', () => {
            const errorUrl = (new AxeBuilder({ client }) as any).errorUrl;
            assert.equal(
              errorUrl,
              'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverio/error-handling.md'
            );
          });
        });

        describe('for versions without axe.runPartial', () => {
          describe('analyze', () => {
            it('returns results axe-core4.2.3', async () => {
              await client.url(`${addr}/index.html`);
              const title = await client.getTitle();
              const results = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              }).analyze();

              assert.notEqual(title, 'Error');
              assert.isNotNull(results);
              assert.isArray(results.violations);
              assert.isArray(results.incomplete);
              assert.isArray(results.passes);
              assert.isArray(results.inapplicable);
            });

            it('throws if axe errors out on the top window', async () => {
              let error: unknown = null;
              await client.url(`${addr}/crash.html`);
              const title = await client.getTitle();
              try {
                await new AxeBuilder({
                  client,
                  axeSource: axeLegacySource + axeCrasherSource
                }).analyze();
              } catch (e) {
                error = e;
              }
              assert.notEqual(title, 'Error');
              assert.isNotNull(error);
            });

            it('tests cross-origin pages', async () => {
              await client.url(`${addr}/cross-origin.html`);
              const title = await client.getTitle();
              const results = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              })
                .withRules(['frame-tested'])
                .analyze();

              const frameTested = results.incomplete.find(
                ({ id }) => id === 'frame-tested'
              );
              assert.notEqual(title, 'Error');
              assert.isUndefined(frameTested);
            });
          });

          describe('disableFrames', () => {
            it('does not return results from disabled iframes', async () => {
              await client.url(`${addr}/nested-iframes.html`);
              const title = await client.getTitle();
              const { violations } = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              })
                .withRules('label')
                .disableFrame('[src*="iframes/baz.html"]')
                .analyze();

              assert.notEqual(title, 'Error');
              assert.equal(violations[0].id, 'label');
              const nodes = violations[0].nodes;
              assert.lengthOf(nodes, 3);
              assert.deepEqual(nodes[0].target, [
                '#ifr-foo',
                '#foo-bar',
                '#bar-baz',
                'input'
              ]);
              assert.deepEqual(nodes[1].target, [
                '#ifr-foo',
                '#foo-baz',
                'input'
              ]);
              assert.deepEqual(nodes[2].target, [
                '#ifr-bar',
                '#bar-baz',
                'input'
              ]);
            });

            it('does not error when disabled iframe does not exist', async () => {
              await client.url(`${addr}/nested-iframes.html`);
              const title = await client.getTitle();

              const { violations } = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              })
                .withRules('label')
                .disableFrame('[src*="does-not-exist.html"]')
                .analyze();

              assert.notEqual(title, 'Error');
              assert.equal(violations[0].id, 'label');
              const nodes = violations[0].nodes;
              assert.lengthOf(nodes, 4);
              assert.deepEqual(nodes[0].target, [
                '#ifr-foo',
                '#foo-bar',
                '#bar-baz',
                'input'
              ]);
              assert.deepEqual(nodes[1].target, [
                '#ifr-foo',
                '#foo-baz',
                'input'
              ]);
              assert.deepEqual(nodes[2].target, [
                '#ifr-bar',
                '#bar-baz',
                'input'
              ]);
              assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
            });

            it('does not return results from disabled framesets', async () => {
              await client.url(`${addr}/nested-frameset.html`);
              const title = await client.getTitle();

              const { violations } = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              })
                .withRules('label')
                .disableFrame('[src*="frameset/baz.html"]')
                .analyze();

              assert.notEqual(title, 'Error');
              assert.equal(violations[0].id, 'label');
              const nodes = violations[0].nodes;
              assert.lengthOf(nodes, 3);
              assert.deepEqual(nodes[0].target, [
                '#frm-foo',
                '#foo-bar',
                '#bar-baz',
                'input'
              ]);
              assert.deepEqual(nodes[1].target, [
                '#frm-foo',
                '#foo-baz',
                'input'
              ]);
              assert.deepEqual(nodes[2].target, [
                '#frm-bar',
                '#bar-baz',
                'input'
              ]);
            });

            it('does not error when disabled frameset does not exist', async () => {
              await client.url(`${addr}/nested-frameset.html`);
              const title = await client.getTitle();

              const { violations } = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              })
                .withRules('label')
                .disableFrame('[src*="does-not-exist.html"]')
                .analyze();

              assert.notEqual(title, 'Error');
              assert.equal(violations[0].id, 'label');
              const nodes = violations[0].nodes;
              assert.lengthOf(nodes, 4);
              assert.deepEqual(nodes[0].target, [
                '#frm-foo',
                '#foo-bar',
                '#bar-baz',
                'input'
              ]);
              assert.deepEqual(nodes[1].target, [
                '#frm-foo',
                '#foo-baz',
                'input'
              ]);
              assert.deepEqual(nodes[2].target, [
                '#frm-bar',
                '#bar-baz',
                'input'
              ]);
              assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
            });
          });

          it('reports frame-tested', async () => {
            await client.url(`${addr}/crash-parent.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({
              client,
              axeSource: axeLegacySource + axeCrasherSource
            })
              .options({ runOnly: ['label', 'frame-tested'] })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(results.incomplete[0].id, 'frame-tested');
            assert.lengthOf(results.incomplete[0].nodes, 1);
            assert.equal(results.violations[0].id, 'label');
            assert.lengthOf(results.violations[0].nodes, 2);
          });
        });

        describe('analyze', () => {
          describe('axeSource', () => {
            it('returns results with different version of axeSource', async () => {
              await client.url(`${addr}/index.html`);
              const title = await client.getTitle();

              const results = await new AxeBuilder({
                client,
                axeSource: axeLegacySource
              }).analyze();

              assert.notEqual(title, 'Error');
              assert.isNotNull(results);
              assert.strictEqual(results.testEngine.version, '4.2.3');
              assert.isArray(results.violations);
              assert.isArray(results.incomplete);
              assert.isArray(results.passes);
              assert.isArray(results.inapplicable);
            });
          });

          it('returns results', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();
            const results = await new AxeBuilder({ client }).analyze();

            assert.notEqual(title, 'Error');
            assert.isNotNull(results);
            assert.isArray(results.violations);
            assert.isArray(results.incomplete);
            assert.isArray(results.passes);
            assert.isArray(results.inapplicable);
          });

          it('reports frame-tested', async () => {
            await client.url(`${addr}/crash-parent.html`);
            const title = await client.getTitle();
            const results = await new AxeBuilder({
              client,
              axeSource: axeSource + axeCrasherSource
            })
              .options({ runOnly: ['label', 'frame-tested'] })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(results.incomplete[0].id, 'frame-tested');
            assert.lengthOf(results.incomplete[0].nodes, 1);
            assert.equal(results.violations[0].id, 'label');
            assert.lengthOf(results.violations[0].nodes, 2);
          });

          it('throws if axe errors out on the top window', async () => {
            let error: unknown = null;
            await client.url(`${addr}/crash.html`);
            const title = await client.getTitle();

            assert.notEqual(title, 'Error');
            try {
              await new AxeBuilder({
                client,
                axeSource: axeSource + axeCrasherSource
              }).analyze();
            } catch (e) {
              error = e;
            }
            assert.isNotNull(error);
          });

          it('throws when injecting a problematic source', async () => {
            let error: unknown = null;
            await client.url(`${addr}/crash.html`);
            const title = await client.getTitle();

            try {
              await new AxeBuilder({
                client,
                axeSource: 'throw new Error()'
              }).analyze();
            } catch (e) {
              error = e;
            }

            assert.notEqual(title, 'Error');
            assert.isNotNull(error);
          });

          it('throws when a setup fails', async () => {
            let error: unknown = null;

            const brokenSource = axeSource + `;window.axe.utils = {};`;
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            try {
              await new AxeBuilder({ client, axeSource: brokenSource })
                .withRules('label')
                .analyze();
            } catch (e) {
              error = e;
            }

            assert.notEqual(title, 'Error');
            assert.isNotNull(error);
          });

          it('properly isolates the call to axe.finishRun', async () => {
            let error: unknown = null;

            await client.url(`${addr}/isolated-finish.html`);
            const title = await client.getTitle();

            try {
              await new AxeBuilder({ client }).analyze();
            } catch (e) {
              error = e;
            }

            assert.notEqual(title, 'Error');
            assert.isNull(error);
          });

          it('handles large results', async function () {
            /* this test handles a large amount of partial results a timeout may be required */
            this.timeout(100_000);
            await client.url(`${addr}/external/index.html`);

            const results = await new AxeBuilder({
              client,
              axeSource: axeSource + axeLargePartial
            }).analyze();

            assert.lengthOf(results.passes, 1);
            assert.equal(results.passes[0].id, 'duplicate-id');
          });

          it('returns correct results metadata', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client }).analyze();

            assert.notEqual(title, 'Error');
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

          it('returns the same results from runPartial as from legacy mode', async () => {
            await client.url(`${addr}/nested-iframes.html`);
            const title = await client.getTitle();

            const legacyResults = await new AxeBuilder({
              axeSource: axeSource + axeForceLegacy,
              client
            }).analyze();
            assert.equal(legacyResults.testEngine.name, 'axe-legacy');

            const normalResults = await new AxeBuilder({
              axeSource: axeSource,
              client
            }).analyze();
            normalResults.timestamp = legacyResults.timestamp;
            normalResults.testEngine.name = legacyResults.testEngine.name;

            assert.notEqual(title, 'Error');
            assert.deepEqual(normalResults, legacyResults);
          });
        });

        describe('disableFrame', () => {
          it('does not inject into disabled iframes', async () => {
            await client.url(`${addr}/nested-iframes.html`);
            const title = await client.getTitle();

            const { violations } = await new AxeBuilder({ client })
              .withRules('label')
              .disableFrame('[src*="iframes/baz.html"]')
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            const nodes = violations[0].nodes;
            assert.lengthOf(nodes, 3);
            assert.deepEqual(nodes[0].target, [
              '#ifr-foo',
              '#foo-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[1].target, [
              '#ifr-foo',
              '#foo-baz',
              'input'
            ]);
            assert.deepEqual(nodes[2].target, [
              '#ifr-bar',
              '#bar-baz',
              'input'
            ]);
          });

          it('does not error when disabled iframe does not exist', async () => {
            await client.url(`${addr}/nested-iframes.html`);
            const title = await client.getTitle();

            const { violations } = await new AxeBuilder({ client })
              .options({ runOnly: 'label' })
              .disableFrame('[src*="does-not-exist.html"]')
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            const nodes = violations[0].nodes;
            assert.lengthOf(nodes, 4);
            assert.deepEqual(nodes[0].target, [
              '#ifr-foo',
              '#foo-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[1].target, [
              '#ifr-foo',
              '#foo-baz',
              'input'
            ]);
            assert.deepEqual(nodes[2].target, [
              '#ifr-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
          });

          it('does not inject into disabled frameset', async () => {
            await client.url(`${addr}/nested-frameset.html`);
            const title = await client.getTitle();

            const { violations } = await new AxeBuilder({ client })
              .withRules('label')
              .disableFrame('[src*="frameset/baz.html"]')
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            const nodes = violations[0].nodes;
            assert.lengthOf(nodes, 3);
            assert.deepEqual(nodes[0].target, [
              '#frm-foo',
              '#foo-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[1].target, [
              '#frm-foo',
              '#foo-baz',
              'input'
            ]);
            assert.deepEqual(nodes[2].target, [
              '#frm-bar',
              '#bar-baz',
              'input'
            ]);
          });

          it('does not error when disabled frameset does not exist', async () => {
            await client.url(`${addr}/nested-frameset.html`);
            const title = await client.getTitle();

            const { violations } = await new AxeBuilder({ client })
              .options({ runOnly: 'label' })
              .disableFrame('[src*="does-not-exist.html"]')
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            const nodes = violations[0].nodes;
            assert.lengthOf(nodes, 4);
            assert.deepEqual(nodes[0].target, [
              '#frm-foo',
              '#foo-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[1].target, [
              '#frm-foo',
              '#foo-baz',
              'input'
            ]);
            assert.deepEqual(nodes[2].target, [
              '#frm-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
          });
        });

        describe('disableRules', () => {
          it('disables the given rules(s) as array', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .disableRules(['region'])
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.isTrue(!all.find(r => r.id === 'region'));
          });

          it('disables the given rules(s) as string', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .disableRules('region')
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.isTrue(!all.find(r => r.id === 'region'));
          });
        });

        describe('frame tests', () => {
          it('injects into nested iframes', async () => {
            await client.url(`${addr}/nested-iframes.html`);
            const title = await client.getTitle();

            const { violations } = await new AxeBuilder({ client })
              .options({ runOnly: 'label' })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            const nodes = violations[0].nodes;
            assert.lengthOf(nodes, 4);
            assert.deepEqual(nodes[0].target, [
              '#ifr-foo',
              '#foo-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[1].target, [
              '#ifr-foo',
              '#foo-baz',
              'input'
            ]);
            assert.deepEqual(nodes[2].target, [
              '#ifr-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
          });

          it('injects into nested frameset', async () => {
            await client.url(`${addr}/nested-frameset.html`);
            const title = await client.getTitle();

            const { violations } = await new AxeBuilder({ client })
              .options({ runOnly: 'label' })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            assert.lengthOf(violations[0].nodes, 4);

            const nodes = violations[0].nodes;
            assert.deepEqual(nodes[0].target, [
              '#frm-foo',
              '#foo-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[1].target, [
              '#frm-foo',
              '#foo-baz',
              'input'
            ]);
            assert.deepEqual(nodes[2].target, [
              '#frm-bar',
              '#bar-baz',
              'input'
            ]);
            assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
          });

          it('should not work on shadow DOM iframes', async () => {
            await client.url(`${addr}/shadow-frames.html`);
            const title = await client.getTitle();

            const { violations, incomplete } = await new AxeBuilder({ client })
              .options({ runOnly: ['label', 'frame-tested'] })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(violations[0].id, 'label');
            assert.lengthOf(violations[0].nodes, 2);

            const nodes = violations[0].nodes;
            assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
            assert.deepEqual(nodes[1].target, ['#slotted-frame', 'input']);

            assert.lengthOf(incomplete, 1);
            assert.lengthOf(incomplete[0].nodes, 1);
            assert.deepEqual(incomplete[0].nodes[0].target, [
              ['#shadow-root', '#shadow-frame']
            ] as any);
          });

          it('reports erroring frames in frame-tested', async () => {
            await client.url(`${addr}/crash-parent.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({
              client,
              axeSource: axeSource + axeCrasherSource
            })
              .options({ runOnly: ['label', 'frame-tested'] })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(results.incomplete[0].id, 'frame-tested');
            assert.lengthOf(results.incomplete[0].nodes, 1);
            assert.deepEqual(results.incomplete[0].nodes[0].target, [
              '#ifr-crash'
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

          it('returns the same results from runPartial as from legacy mode', async () => {
            await client.url(`${addr}/nested-iframes.html`);
            const title = await client.getTitle();

            const legacyResults = await new AxeBuilder({
              client,
              axeSource: axeSource + axeForceLegacy
            }).analyze();

            assert.notEqual(title, 'Error');
            assert.equal(legacyResults.testEngine.name, 'axe-legacy');

            const normalResults = await new AxeBuilder({
              client,
              axeSource: axeSource
            }).analyze();
            normalResults.timestamp = legacyResults.timestamp;
            normalResults.testEngine.name = legacyResults.testEngine.name;
            assert.deepEqual(normalResults, legacyResults);
          });

          it('handles unloaded iframes (e.g. loading=lazy)', async () => {
            await client.url(`${addr}/lazy-loaded-iframe.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .options({ runOnly: ['label', 'frame-tested'] })
              .analyze();

            assert.notEqual(title, 'Error');
            assert.equal(results.incomplete[0].id, 'frame-tested');
            assert.lengthOf(results.incomplete[0].nodes, 1);
            assert.deepEqual(results.incomplete[0].nodes[0].target, [
              '#ifr-lazy',
              '#lazy-iframe'
            ]);
            assert.equal(results.violations[0].id, 'label');
            assert.lengthOf(results.violations[0].nodes, 1);
            assert.deepEqual(results.violations[0].nodes[0].target, [
              '#ifr-lazy',
              '#lazy-baz',
              'input'
            ]);
          });

          it('resets pageLoad timeout to user setting', async () => {
            await client.url(`${addr}/lazy-loaded-iframe.html`);
            client.setTimeout({ pageLoad: 500 });
            await client.getTitle();

            await new AxeBuilder({ client })
              .options({ runOnly: ['label', 'frame-tested'] })
              .analyze();

            const timeout = await client.getTimeouts();
            assert.equal(timeout.pageLoad, 500);
          });
        });

        describe('logOrRethrowError', () => {
          it('log a StaleElementReference Error with `seleniumStack`', () => {
            const error = new Error('Selenium Error');
            error.seleniumStack = {
              type: 'StaleElementReference'
            };
            assert.doesNotThrow(() => logOrRethrowError(error as any));
          });

          it('log a `stale element reference` Error', () => {
            const error = new Error('foobar');
            error.name = 'stale element reference';
            assert.doesNotThrow(() => logOrRethrowError(error));
          });

          it('throws errors that are not StaleElementReferenceErrors', () => {
            const error = new Error('foo');
            assert.throws(() => logOrRethrowError(error));
          });

          it('throws if non-Error content is passed', () => {
            assert.throws(() => logOrRethrowError('error'));
          });
        });

        describe('withRules', () => {
          it('only runs the provided rules as an array', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .withRules(['region'])
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.strictEqual(all.length, 1);
            assert.strictEqual(all[0].id, 'region');
          });

          it('only runs the provided rules as a string', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .withRules('region')
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.strictEqual(all.length, 1);
            assert.strictEqual(all[0].id, 'region');
          });
        });

        describe('options', () => {
          it('passes options to axe-core', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .options({ rules: { region: { enabled: false } } })
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.isTrue(!all.find(r => r.id === 'region'));
          });
        });

        describe('withTags', () => {
          it('only rules rules with the given tag(s) as an array', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .withTags(['best-practice'])
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.isOk(all);
            for (const rule of all) {
              assert.include(rule.tags, 'best-practice');
            }
          });

          it('only rules rules with the given tag(s) as a string', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .withTags('best-practice')
              .analyze();
            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');
            assert.isOk(all);
            for (const rule of all) {
              assert.include(rule.tags, 'best-practice');
            }
          });

          it('No results provided when the given tag(s) is invalid', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .withTags(['foobar'])
              .analyze();

            const all = [
              ...results.passes,
              ...results.inapplicable,
              ...results.violations,
              ...results.incomplete
            ];

            assert.notEqual(title, 'Error');

            // Ensure all run rules had the "foobar" tag
            assert.lengthOf(all, 0);
          });
        });

        describe('include/exclude', () => {
          const flatPassesTargets = (results: AxeResults): string[] => {
            return results.passes
              .reduce((acc, pass) => {
                return acc.concat(pass.nodes as any);
              }, [])
              .reduce((acc, node: any) => {
                return acc.concat(node.target.flat(1));
              }, []);
          };

          it('with include and exclude', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client })
              .include('.include')
              .exclude('.exclude');
            const results = await builder.analyze();

            assert.notEqual(title, 'Error');
            assert.isTrue(flatPassesTargets(results).includes('.include'));
            assert.isFalse(flatPassesTargets(results).includes('.exclude'));
          });

          it('with only include', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client }).include('.include');
            const results = await builder.analyze();

            assert.notEqual(title, 'Error');
            assert.isTrue(flatPassesTargets(results).includes('.include'));
          });

          it('with only exclude', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client }).exclude('.exclude');
            const results = await builder.analyze();

            assert.notEqual(title, 'Error');
            assert.isFalse(flatPassesTargets(results).includes('.exclude'));
          });

          it('with only chaining include', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client })
              .include('.include')
              .include('.include2');

            const results = await builder.analyze();

            assert.notEqual(title, 'Error');
            assert.isTrue(flatPassesTargets(results).includes('.include'));
            assert.isTrue(flatPassesTargets(results).includes('.include2'));
          });

          it('with only chaining exclude', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client })
              .exclude('.exclude')
              .exclude('.exclude2');

            const results = await builder.analyze();

            assert.notEqual(title, 'Error');
            assert.isFalse(flatPassesTargets(results).includes('.exclude'));
            assert.isFalse(flatPassesTargets(results).includes('.exclude2'));
          });

          it('with chaining include and exclude', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client })
              .include('.include')
              .include('.include2')
              .exclude('.exclude')
              .exclude('.exclude2');

            const results = await builder.analyze();

            assert.notEqual(title, 'Error');
            assert.isTrue(flatPassesTargets(results).includes('.include'));
            assert.isTrue(flatPassesTargets(results).includes('.include2'));
            assert.isFalse(flatPassesTargets(results).includes('.exclude'));
            assert.isFalse(flatPassesTargets(results).includes('.exclude2'));
          });

          it('with include and exclude iframes', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client })
              .include(['#ifr-inc-excl', 'html'])
              .exclude(['#ifr-inc-excl', '#foo-bar'])
              .include(['#ifr-inc-excl', '#foo-baz', 'html'])
              .exclude(['#ifr-inc-excl', '#foo-baz', 'input']);

            const results = await builder.analyze();
            const labelResult = results.incomplete.find(
              ({ id }) => id === 'label'
            );

            assert.notEqual(title, 'Error');
            assert.isFalse(flatPassesTargets(results).includes('#foo-bar'));
            assert.isFalse(flatPassesTargets(results).includes('input'));
            assert.isUndefined(labelResult);
          });

          it('with include and exclude iframes', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const title = await client.getTitle();

            const builder = new AxeBuilder({ client })
              .include(['#ifr-inc-excl', '#foo-baz', 'html'])
              .include(['#ifr-inc-excl', '#foo-baz', 'input'])
              // does not exist
              .include(['#hazaar', 'html']);

            const results = await builder.analyze();
            const labelResult = results.violations.find(
              ({ id }) => id === 'label'
            );

            assert.notEqual(title, 'Error');
            assert.isTrue(flatPassesTargets(results).includes('#ifr-inc-excl'));
            assert.isTrue(flatPassesTargets(results).includes('#foo-baz'));
            assert.isTrue(flatPassesTargets(results).includes('input'));
            assert.isFalse(flatPassesTargets(results).includes('#foo-bar'));
            // does not exist
            assert.isFalse(flatPassesTargets(results).includes('#hazaar'));
            assert.isDefined(labelResult);
          });

          it('with labelled frame', async () => {
            await client.url(`${addr}/context-include-exclude.html`);
            const results = await new AxeBuilder({ client })
              .include({ fromFrames: ['#ifr-inc-excl', 'html'] })
              .exclude({ fromFrames: ['#ifr-inc-excl', '#foo-bar'] })
              .include({ fromFrames: ['#ifr-inc-excl', '#foo-baz', 'html'] })
              .exclude({ fromFrames: ['#ifr-inc-excl', '#foo-baz', 'input'] })
              .analyze();
            const labelResult = results.violations.find(
              (r: Result) => r.id === 'label'
            );
            assert.isFalse(flatPassesTargets(results).includes('#foo-bar'));
            assert.isFalse(flatPassesTargets(results).includes('input'));
            assert.isUndefined(labelResult);
          });

          it('with include shadow DOM', async () => {
            await client.url(`${addr}/shadow-dom.html`);
            const results = await new AxeBuilder({ client })
              .include([['#shadow-root-1', '#shadow-button-1']])
              .include([['#shadow-root-2', '#shadow-button-2']])
              .analyze();
            assert.isTrue(
              flatPassesTargets(results).includes('#shadow-button-1')
            );
            assert.isTrue(
              flatPassesTargets(results).includes('#shadow-button-2')
            );
            assert.isFalse(flatPassesTargets(results).includes('#button'));
          });

          it('with exclude shadow DOM', async () => {
            await client.url(`${addr}/shadow-dom.html`);
            const results = await new AxeBuilder({ client })
              .exclude([['#shadow-root-1', '#shadow-button-1']])
              .exclude([['#shadow-root-2', '#shadow-button-2']])
              .analyze();
            assert.isFalse(
              flatPassesTargets(results).includes('#shadow-button-1')
            );
            assert.isFalse(
              flatPassesTargets(results).includes('#shadow-button-2')
            );
            assert.isTrue(flatPassesTargets(results).includes('#button'));
          });

          it('with labelled shadow DOM', async () => {
            await client.url(`${addr}/shadow-dom.html`);
            const results = await new AxeBuilder({ client })
              .include({
                fromShadowDom: ['#shadow-root-1', '#shadow-button-1']
              })
              .exclude({
                fromShadowDom: ['#shadow-root-2', '#shadow-button-2']
              })
              .analyze();
            assert.isTrue(
              flatPassesTargets(results).includes('#shadow-button-1')
            );
            assert.isFalse(
              flatPassesTargets(results).includes('#shadow-button-2')
            );
          });

          it('with labelled iframe and shadow DOM', async () => {
            await client.url(`${addr}/shadow-frames.html`);
            const { violations } = await new AxeBuilder({ client })
              .exclude({
                fromFrames: [
                  {
                    fromShadowDom: ['#shadow-root', '#shadow-frame']
                  },
                  'input'
                ]
              })
              .options({ runOnly: 'label' })
              .analyze();
            assert.equal(violations[0].id, 'label');
            assert.lengthOf(violations[0].nodes, 2);
            const nodes = violations[0].nodes;
            assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
            assert.deepEqual(nodes[1].target, ['#slotted-frame', 'input']);
          });
        });

        describe('setLegacyMode', () => {
          const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
          it('runs legacy mode when used', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({
              client,
              axeSource: axeSource + runPartialThrows
            })
              .setLegacyMode()
              .analyze();

            assert.notEqual(title, 'Error');
            assert.isNotNull(results);
          });

          it('prevents cross-origin frame testing', async () => {
            await client.url(`${addr}/cross-origin.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({
              client,
              axeSource: axeSource + runPartialThrows
            })
              .withRules('frame-tested')
              .setLegacyMode()
              .analyze();

            const frameTested = results.incomplete.find(
              ({ id }) => id === 'frame-tested'
            );

            assert.notEqual(title, 'Error');
            assert.ok(frameTested);
          });

          it('can be disabled again', async () => {
            await client.url(`${addr}/cross-origin.html`);
            const title = await client.getTitle();

            const results = await new AxeBuilder({ client })
              .withRules('frame-tested')
              .setLegacyMode()
              .setLegacyMode(false)
              .analyze();

            const frameTested = results.incomplete.find(
              ({ id }) => id === 'frame-tested'
            );

            assert.notEqual(title, 'Error');
            assert.isUndefined(frameTested);
          });
        });

        describe('callback()', () => {
          it('returns results when callback is provided', async () => {
            await client.url(`${addr}/index.html`);
            const title = await client.getTitle();

            assert.notEqual(title, 'Error');

            new AxeBuilder({ client }).analyze((err, results) => {
              assert.isNull(err);
              assert.isNotNull(results);
              assert.isArray(results?.violations);
              assert.isArray(results?.incomplete);
              assert.isArray(results?.passes);
              assert.isArray(results?.inapplicable);
            });
          });

          it('returns an error as the first argument', done => {
            Promise.resolve(client.url(`${addr}/index.html`));
            new AxeBuilder({ client, axeSource: 'throw new Error()' }).analyze(
              (err, results) => {
                try {
                  assert.isNull(results);
                  assert.isNotNull(err);
                  done();
                } catch (e) {
                  done(e);
                }
              }
            );
          });
        });
      });

      describe('axe.finishRun errors', () => {
        const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;

        it('throws an error if window.open throws', async () => {
          await client.url(`${addr}/index.html`);
          const title = await client.getTitle();

          assert.notEqual(title, 'Error');

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete client.createWindow;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          client.createWindow = () => {
            return { handle: null };
          };
          try {
            await new AxeBuilder({
              client,
              axeSource: axeSource
            }).analyze();
            assert.fail('Should have thrown');
          } catch (err) {
            assert.match(
              (err as Error).message,
              /Please make sure that you have popup blockers disabled./
            );
            assert.include(
              (err as Error).message,
              'Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverio/error-handling.md'
            );
          }
        });

        it('throw an error with modified url', async () => {
          await client.url(`${addr}/index.html`);
          const title = await client.getTitle();

          assert.notEqual(title, 'Error');

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete client.createWindow;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          client.createWindow = () => {
            return { handle: null };
          };
          try {
            const builder = new AxeBuilder({
              client,
              axeSource: axeSource
            }) as any;
            builder.errorUrl = 'https://deque.biz';
            await builder.analyze();
            assert.fail('Should have thrown');
          } catch (err) {
            assert.match(
              (err as Error).message,
              /Please make sure that you have popup blockers disabled./
            );
            assert.include(
              (err as Error).message,
              'Please check out https://deque.biz'
            );
          }
        });

        it('throws an error if axe.finishRun throws', async () => {
          await client.url(`${addr}/index.html`);
          const title = await client.getTitle();

          assert.notEqual(title, 'Error');

          try {
            await new AxeBuilder({
              client,
              axeSource: axeSource + finishRunThrows
            }).analyze();
            assert.fail('Should have thrown');
          } catch (err) {
            assert.match((err as Error).message, /Please check out/);
          }
        });
      });

      describe('allowedOrigins', () => {
        const promisify = <T>(thenable: Promise<T>): Promise<T> => {
          return new Promise((resolve, reject) => {
            thenable.then(resolve, reject);
          });
        };

        const getAllowedOrigins = async (): Promise<string[]> => {
          return promisify(
            client.executeAsync(
              `
              var callback = arguments[arguments.length - 1];
              var allowedOrigins = axe._audit.allowedOrigins
              callback(allowedOrigins);
              `
            ) as any
          );
        };

        it('should not set when running runPartial and not legacy mode', async () => {
          await client.url(`${addr}/index.html`);
          await new AxeBuilder({ client }).analyze();
          const allowedOrigins = await getAllowedOrigins();
          assert.deepEqual(allowedOrigins, [addr]);
        });

        it('should not set when running runPartial and legacy mode', async () => {
          await client.url(`${addr}/index.html`);
          await new AxeBuilder({ client }).setLegacyMode(true).analyze();
          const allowedOrigins = await getAllowedOrigins();
          assert.deepEqual(allowedOrigins, [addr]);
        });

        it('should not set when running legacy source and legacy mode', async () => {
          await client.url(`${addr}/index.html`);
          await new AxeBuilder({ client, axeSource: axeLegacySource })
            .setLegacyMode(true)
            .analyze();
          const allowedOrigins = await getAllowedOrigins();
          assert.deepEqual(allowedOrigins, [addr]);
        });

        it('should set when running legacy source and not legacy mode', async () => {
          await client.url(`${addr}/index.html`);
          await new AxeBuilder({
            client,
            axeSource: axeLegacySource
          }).analyze();
          const allowedOrigins = await getAllowedOrigins();
          assert.deepEqual(allowedOrigins, ['*']);
        });
      });
    });
  }
});
