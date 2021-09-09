import 'mocha';
import * as webdriverio from 'webdriverio';
const sync = require('@wdio/sync').default;
import * as wdio from '@wdio/sync';
import * as express from 'express';
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

describe('@axe-core/webdriverio', () => {
  describe('WebdriverIO Async', () => {
    let server: Server;
    let addr: string;
    let client: webdriverio.BrowserObject;
    const axePath = require.resolve('axe-core');
    const axeSource = fs.readFileSync(axePath, 'utf8');
    const axeTestFixtures = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'external'
    );
    const axeLegacySource = fs.readFileSync(
      path.resolve(axeTestFixtures, 'axe-core@legacy.js'),
      'utf-8'
    );
    const axeCrasherSource = fs.readFileSync(
      path.join(axeTestFixtures, 'axe-crasher.js'),
      'utf8'
    );
    const axeForceLegacy = fs.readFileSync(
      path.join(axeTestFixtures, 'axe-force-legacy.js'),
      'utf8'
    );
    const noHtmlConfig = `;axe.configure({ noHtml: true })`;

    beforeEach(async () => {
      const app = express();
      let binaryPath;
      app.use(express.static(axeTestFixtures));
      server = createServer(app);
      addr = await testListen(server);
      if (
        fs.existsSync(`C:/Program Files/Google/Chrome/Application/chrome.exe`)
      ) {
        binaryPath = `C:/Program Files/Google/Chrome/Application/chrome.exe`;
      }

      const options: webdriverio.RemoteOptions = {
        path: '/',
        automationProtocol: 'devtools',
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['--headless'],
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
      it('check to make sure that client is running devtools protocol', () => {
        assert.isTrue(client.isDevTools);
      });

      it('throws a useful error when not given a valid client', () => {
        assert.throws(
          () => new AxeBuilder({ client: () => 'foobar' } as any),
          /An instantiated WebdriverIO client greater than v5 is required/
        );
      });

      describe('for versions without axe.runPartial', () => {
        describe('analyze', () => {
          it('returns results axe-core4.0.3', async () => {
            await client.url(`${addr}/index.html`);
            const results = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            }).analyze();
            assert.isNotNull(results);
            assert.isArray(results.violations);
            assert.isArray(results.incomplete);
            assert.isArray(results.passes);
            assert.isArray(results.inapplicable);
          });

          it('throws if axe errors out on the top window', async () => {
            let error: Error | null = null;
            await client.url(`${addr}/crash.html`);
            try {
              await new AxeBuilder({
                client,
                axeSource: axeLegacySource + axeCrasherSource
              }).analyze();
            } catch (e) {
              error = e;
            }
            assert.isNotNull(error);
          });

          it('tests cross-origin pages', async () => {
            await client.url(`${addr}/cross-origin.html`);
            const results = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            })
              .withRules(['frame-tested'])
              .analyze();

            const frameTested = results.incomplete.find(
              ({ id }) => id === 'frame-tested'
            );
            assert.isUndefined(frameTested);
          });
        });

        describe('disableFrames', () => {
          it('does not return results from disabled iframes', async () => {
            await client.url(`${addr}/nested-iframes.html`);
            const { violations } = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            })
              .withRules('label')
              .disableFrame('[src*="iframes/baz.html"]')
              .analyze();

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
            const { violations } = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            })
              .withRules('label')
              .disableFrame('[src*="does-not-exist.html"]')
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
            const { violations } = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            })
              .withRules('label')
              .disableFrame('[src*="frameset/baz.html"]')
              .analyze();
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
            const { violations } = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            })
              .withRules('label')
              .disableFrame('[src*="does-not-exist.html"]')
              .analyze();
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
      });

      describe('analyze', () => {
        describe('axeSource', () => {
          it('returns results with different version of axeSource', async () => {
            await client.url(`${addr}/index.html`);
            const results = await new AxeBuilder({
              client,
              axeSource: axeLegacySource
            }).analyze();

            assert.isNotNull(results);
            assert.strictEqual(results.testEngine.version, '4.0.3');
            assert.isArray(results.violations);
            assert.isArray(results.incomplete);
            assert.isArray(results.passes);
            assert.isArray(results.inapplicable);
          });
        });

        it('returns results', async () => {
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client }).analyze();
          assert.isNotNull(results);
          assert.isArray(results.violations);
          assert.isArray(results.incomplete);
          assert.isArray(results.passes);
          assert.isArray(results.inapplicable);
        });

        it('reports frame-tested', async () => {
          await client.url(`${addr}/crash-parent.html`);
          const results = await new AxeBuilder({
            client,
            axeSource: axeSource + axeCrasherSource
          })
            .options({ runOnly: ['label', 'frame-tested'] })
            .analyze();
          assert.equal(results.incomplete[0].id, 'frame-tested');
          assert.lengthOf(results.incomplete[0].nodes, 2);
          assert.equal(results.violations[0].id, 'label');
          assert.lengthOf(results.violations[0].nodes, 1);
        });

        it('throws if axe errors out on the top window', async () => {
          let error: Error | null = null;
          await client.url(`${addr}/crash.html`);
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
          let error: Error | null = null;
          await client.url(`${addr}/crash-me.html`);
          try {
            await new AxeBuilder({
              client,
              axeSource: 'throw new Error()'
            }).analyze();
          } catch (e) {
            error = e;
          }
          assert.isNotNull(error);
        });

        it('throws when a setup fails', async () => {
          let error: Error | null = null;

          const brokenSource = axeSource + `;window.axe.utils = {};`;
          await client.url(`${addr}/index.html`);
          try {
            await new AxeBuilder({ client, axeSource: brokenSource })
              .withRules('label')
              .analyze();
          } catch (e) {
            error = e;
          }

          assert.isNotNull(error);
        });

        it('properly isolates the call to axe.finishRun', async () => {
          let error: Error | null = null;

          await client.url(`${addr}/isolated-finish.html`);
          try {
            await new AxeBuilder({ client }).analyze();
          } catch (e) {
            error = e;
          }

          assert.isNull(error);
        });

        it('returns correct results metadata', async () => {
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({ client }).analyze();
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
          const legacyResults = await new AxeBuilder({
            axeSource: axeSource + noHtmlConfig + axeForceLegacy,
            client
          }).analyze();
          assert.equal(legacyResults.testEngine.name, 'axe-legacy');

          const normalResults = await new AxeBuilder({
            axeSource: axeSource + noHtmlConfig,
            client
          }).analyze();
          normalResults.timestamp = legacyResults.timestamp;
          normalResults.testEngine.name = legacyResults.testEngine.name;
          assert.deepEqual(normalResults, legacyResults);
        });
      });

      describe('disableFrame', () => {
        it('does not inject into disabled iframes', async () => {
          await client.url(`${addr}/nested-iframes.html`);
          const { violations } = await new AxeBuilder({ client })
            .withRules('label')
            .disableFrame('[src*="iframes/baz.html"]')
            .analyze();

          assert.equal(violations[0].id, 'label');
          const nodes = violations[0].nodes;
          assert.lengthOf(nodes, 3);
          assert.deepEqual(nodes[0].target, [
            '#ifr-foo',
            '#foo-bar',
            '#bar-baz',
            'input'
          ]);
          assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
          assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
        });

        it('does not error when disabled iframe does not exist', async () => {
          await client.url(`${addr}/nested-iframes.html`);
          const { violations } = await new AxeBuilder({ client })
            .options({ runOnly: 'label' })
            .disableFrame('[src*="does-not-exist.html"]')
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

        it('does not inject into disabled frameset', async () => {
          await client.url(`${addr}/nested-frameset.html`);
          const { violations } = await new AxeBuilder({ client })
            .withRules('label')
            .disableFrame('[src*="frameset/baz.html"]')
            .analyze();
          assert.equal(violations[0].id, 'label');
          const nodes = violations[0].nodes;
          assert.lengthOf(nodes, 3);
          assert.deepEqual(nodes[0].target, [
            '#frm-foo',
            '#foo-bar',
            '#bar-baz',
            'input'
          ]);
          assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
          assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
        });

        it('does not error when disabled frameset does not exist', async () => {
          await client.url(`${addr}/nested-frameset.html`);
          const { violations } = await new AxeBuilder({ client })
            .options({ runOnly: 'label' })
            .disableFrame('[src*="does-not-exist.html"]')
            .analyze();
          assert.equal(violations[0].id, 'label');
          const nodes = violations[0].nodes;
          assert.lengthOf(nodes, 4);
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

      describe('frame tests', () => {
        it('injects into nested iframes', async () => {
          await client.url(`${addr}/nested-iframes.html`);
          const { violations } = await new AxeBuilder({ client })
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
          await client.url(`${addr}/nested-frameset.html`);
          const { violations } = await new AxeBuilder({ client })
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

        it('should not work on shadow DOM iframes', async () => {
          await client.url(`${addr}/shadow-frames.html`);
          const { violations, incomplete } = await new AxeBuilder({ client })
            .options({ runOnly: ['label', 'frame-tested'] })
            .analyze();

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
          assert.lengthOf(all, 0);
        });
      });

      describe('include/exclude', () => {
        it('with include and exclude', async () => {
          let error: Error | null = null;
          await client.url(`${addr}/nested-iframes.html`);
          const builder = new AxeBuilder({ client })
            .include('#ifr-foo')
            .exclude('#ifr-bar');

          try {
            await builder.analyze();
          } catch (e) {
            error = e;
          }

          assert.strictEqual(error, null);
        });

        it('with only include', async () => {
          let error: Error | null = null;
          await client.url(`${addr}/nested-iframes.html`);
          const builder = new AxeBuilder({ client }).include('#ifr-foo');

          try {
            await builder.analyze();
          } catch (e) {
            error = e;
          }

          assert.strictEqual(error, null);
        });

        it('wth only exclude', async () => {
          let error: Error | null = null;
          await client.url(`${addr}/nested-iframes.html`);
          const builder = new AxeBuilder({ client }).exclude('#ifr-bar');

          try {
            await builder.analyze();
          } catch (e) {
            error = e;
          }

          assert.strictEqual(error, null);
        });
      });

      describe('setLegacyMode', () => {
        const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
        it('runs legacy mode when used', async () => {
          await client.url(`${addr}/index.html`);
          const results = await new AxeBuilder({
            client,
            axeSource: axeSource + runPartialThrows
          })
            .setLegacyMode()
            .analyze();
          assert.isNotNull(results);
        });

        it('prevents cross-origin frame testing', async () => {
          await client.url(`${addr}/cross-origin.html`);
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
          assert.ok(frameTested);
        });

        it('can be disabled again', async () => {
          await client.url(`${addr}/cross-origin.html`);
          const results = await new AxeBuilder({ client })
            .withRules('frame-tested')
            .setLegacyMode()
            .setLegacyMode(false)
            .analyze();

          const frameTested = results.incomplete.find(
            ({ id }) => id === 'frame-tested'
          );
          assert.isUndefined(frameTested);
        });
      });

      describe('callback()', () => {
        it('returns results when callback is provided', async () => {
          await client.url(`${addr}/index.html`);
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
  });

  describe('WebdriverIO Sync', () => {
    let server: Server;
    let addr: string;
    let remote: any;
    const axeTestFixtures = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'external'
    );
    beforeEach(async () => {
      const app = express();
      app.use(express.static(axeTestFixtures));
      server = createServer(app);
      addr = await testListen(server);

      remote = webdriverio.remote({
        automationProtocol: 'devtools',
        path: '/',
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['--headless']
          }
        },
        logLevel: 'error'
      });
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
            assert.isTrue(client.isDevTools);
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
