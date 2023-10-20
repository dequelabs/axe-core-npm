import 'mocha';
import type { AxeResults, Result } from 'axe-core';
import type { WebDriver } from 'selenium-webdriver';
import express from 'express';
import testListen from 'test-listen';
import { assert } from 'chai';
import path from 'path';
import fs from 'fs';
import { Server, createServer } from 'http';
import { Webdriver } from './test-utils';
import { AxeBuilder } from '../src';
import { axeRunPartial } from '../src/browser';
import { fixturesPath } from 'axe-test-fixtures';

const dylangConfig = JSON.parse(
  fs.readFileSync(path.join(fixturesPath, 'dylang-config.json'), 'utf8')
);

describe('@axe-core/webdriverjs', () => {
  let driver: WebDriver;
  let server: Server;
  let addr: string;
  let axeSource: string;
  let axeCrasherSource: string;
  let axeForceLegacy: string;
  let axeLargePartial: string;

  before(async () => {
    const axePath = require.resolve('axe-core');
    axeSource = fs.readFileSync(axePath, 'utf8');
    axeCrasherSource = fs.readFileSync(
      path.join(fixturesPath, 'axe-crasher.js'),
      'utf8'
    );
    axeForceLegacy = fs.readFileSync(
      path.join(fixturesPath, 'axe-force-legacy.js'),
      'utf8'
    );
    axeLargePartial = fs.readFileSync(
      path.join(fixturesPath, 'axe-large-partial.js'),
      'utf8'
    );

    const app = express();
    app.use(express.static(fixturesPath));
    server = createServer(app);
    addr = await testListen(server);
  });

  beforeEach(async () => {
    driver = Webdriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  after(() => {
    server.close();
  });

  describe('analyze', () => {
    it('returns results', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();
      const results = await new AxeBuilder(driver).analyze();

      assert.notEqual(title, 'Error');
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('handles undefineds', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();
      const results = await new AxeBuilder(driver).analyze();

      assert.notEqual(title, 'Error');
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('returns correct results metadata', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();
      const results = await new AxeBuilder(driver).analyze();

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

    it('properly isolates the call to axe.finishRun', async () => {
      let err;
      await driver.get(`${addr}/isolated-finish.html`);
      const title = await driver.getTitle();
      try {
        await new AxeBuilder(driver).analyze();
      } catch (e) {
        err = e;
      }

      assert.notEqual(title, 'Error');
      assert.isUndefined(err);
    });

    it('handles large results', async function () {
      /* this test handles a large amount of partial results a timeout may be required */
      this.timeout(60_000);
      await driver.get(`${addr}/index.html`);

      const results = await new AxeBuilder(
        driver,
        axeSource + axeLargePartial
      ).analyze();

      assert.lengthOf(results.passes, 1);
      assert.equal(results.passes[0].id, 'duplicate-id');
    });

    it('throws if axe errors out on the top window', async () => {
      await driver.get(`${addr}/crash.html`);
      const title = await driver.getTitle();
      let err;

      try {
        await new AxeBuilder(driver, axeSource + axeCrasherSource).analyze();
      } catch (error) {
        err = error;
      }

      assert.notEqual(title, 'Error');
      assert.isDefined(err);
    });

    it('throws when injecting a problematic source', async () => {
      await driver.get(`${addr}/crash.html`);
      const title = await driver.getTitle();
      let err;

      try {
        await new AxeBuilder(driver, 'throw new Error()').analyze();
      } catch (error) {
        err = error;
      }

      assert.notEqual(title, 'Error');
      assert.isDefined(err);
    });

    it('throws when a setup fails', async () => {
      const brokenSource = axeSource + `;window.axe.utils = {}`;
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();
      let err;

      try {
        await new AxeBuilder(driver, brokenSource).withRules('label').analyze();
      } catch (error) {
        err = error;
      }

      assert.notEqual(title, 'Error');
      assert.isDefined(err);
    });
  });

  describe('errorUrl', () => {
    it('returns correct errorUrl', () => {
      const errorUrl = (new AxeBuilder(driver) as any).errorUrl;
      assert.equal(
        errorUrl,
        'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverjs/error-handling.md'
      );
    });
  });

  describe('configure', () => {
    it('should find configured violations in all iframes', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
        .configure(dylangConfig)
        .analyze();

      assert.notEqual(title, 'Error');
      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a iframe
      assert.equal(results.violations[0].nodes.length, 8);
    });

    it('should find configured violations in all framesets', async () => {
      await driver.get(`${addr}/nested-frameset.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
        .configure(dylangConfig)
        .analyze();

      assert.notEqual(title, 'Error');
      assert.equal(results.violations[0].id, 'dylang');
      // the second violation is in a frame
      assert.equal(results.violations[0].nodes.length, 8);
    });

    it('throws when passed a non-object', () => {
      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        /* @ts-expect-error */
        new AxeBuilder(driver, axe403Source).configure('abc123');
      });
    });
  });

  describe('disableRules', () => {
    it('disables the given rules(s) as array', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/nested-iframes.html`);
      const title = await driver.getTitle();

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

      assert.notEqual(title, 'Error');
      assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
    });

    it('injects into nested frameset', async () => {
      await driver.get(`${addr}/nested-frameset.html`);
      const title = await driver.getTitle();

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

      assert.notEqual(title, 'Error');
      assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
    });

    it('should work on shadow DOM iframes', async () => {
      await driver.get(`${addr}/shadow-frames.html`);
      const title = await driver.getTitle();

      const { violations } = await new AxeBuilder(driver)
        .options({ runOnly: 'label' })
        .analyze();

      assert.notEqual(title, 'Error');
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
      await driver.get(`${addr}/crash-parent.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver, axeSource + axeCrasherSource)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.notEqual(title, 'Error');
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
      const title = await driver.getTitle();

      const legacyResults = await new AxeBuilder(
        driver,
        axeSource + axeForceLegacy
      ).analyze();

      assert.notEqual(title, 'Error');
      assert.equal(legacyResults.testEngine.name, 'axe-legacy');

      const normalResults = await new AxeBuilder(driver, axeSource).analyze();
      normalResults.timestamp = legacyResults.timestamp;
      normalResults.testEngine.name = legacyResults.testEngine.name;
      assert.deepEqual(normalResults, legacyResults);
    });

    it('skips unloaded iframes (e.g. loading=lazy)', async () => {
      await driver.get(`${addr}/lazy-loaded-iframe.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/lazy-loaded-iframe.html`);
      driver.manage().setTimeouts({ pageLoad: 500 });
      await driver.getTitle();

      await new AxeBuilder(driver)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      const timeout = await driver.manage().getTimeouts();
      assert.equal(timeout.pageLoad, 500);
    });
  });

  describe('withRules', () => {
    it('only runs the provided rules as an array', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
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
          return acc.concat(node.target.flat(1));
        }, []);
    };
    it('with include and exclude', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const builder = new AxeBuilder(driver)
        .include('.include')
        .exclude('.exclude');
      const results = await builder.analyze();

      assert.notEqual(title, 'Error');
      assert.isTrue(flatPassesTargets(results).includes('.include'));
      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
    });

    it('with only include', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const builder = new AxeBuilder(driver).include('.include');
      const results = await builder.analyze();

      assert.notEqual(title, 'Error');
      assert.isTrue(flatPassesTargets(results).includes('.include'));
    });

    it('with only exclude', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const builder = new AxeBuilder(driver).exclude('.exclude');
      const results = await builder.analyze();

      assert.notEqual(title, 'Error');
      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
    });

    it('with chaining only include', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const builder = new AxeBuilder(driver)
        .include('.include')
        .include('.include2');
      const results = await builder.analyze();

      assert.notEqual(title, 'Error');
      assert.isTrue(flatPassesTargets(results).includes('.include'));
      assert.isTrue(flatPassesTargets(results).includes('.include2'));
    });

    it('with chaining only exclude', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const builder = new AxeBuilder(driver)
        .exclude('.exclude')
        .exclude('.exclude2');
      const results = await builder.analyze();

      assert.notEqual(title, 'Error');
      assert.isFalse(flatPassesTargets(results).includes('.exclude'));
      assert.isFalse(flatPassesTargets(results).includes('.exclude2'));
    });

    it('with chaining include and exclude', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const builder = new AxeBuilder(driver)
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
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
        .include(['#ifr-inc-excl', 'html'])
        .exclude(['#ifr-inc-excl', '#foo-bar'])
        .include(['#ifr-inc-excl', '#foo-baz', 'html'])
        .exclude(['#ifr-inc-excl', '#foo-baz', 'input'])
        .analyze();

      const labelResult = results.violations.find(
        (r: Result) => r.id === 'label'
      );
      assert.notEqual(title, 'Error');
      assert.isFalse(flatPassesTargets(results).includes('#foo-bar'));
      assert.isFalse(flatPassesTargets(results).includes('input'));
      assert.isUndefined(labelResult);
    });

    it('with include iframes', async () => {
      await driver.get(`${addr}/context-include-exclude.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
        .include(['#ifr-inc-excl', '#foo-baz', 'html'])
        .include(['#ifr-inc-excl', '#foo-baz', 'input'])
        // does not exist
        .include(['#hazaar', 'html'])
        .analyze();

      const labelResult = results.violations.find(
        (r: Result) => r.id === 'label'
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
      await driver.get(`${addr}/context-include-exclude.html`);
      const results = await new AxeBuilder(driver)
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
      await driver.get(`${addr}/shadow-dom.html`);
      const results = await new AxeBuilder(driver)
        .include([['#shadow-root-1', '#shadow-button-1']])
        .include([['#shadow-root-2', '#shadow-button-2']])
        .analyze();
      assert.isTrue(flatPassesTargets(results).includes('#shadow-button-1'));
      assert.isTrue(flatPassesTargets(results).includes('#shadow-button-2'));
      assert.isFalse(flatPassesTargets(results).includes('#button'));
    });

    it('with exclude shadow DOM', async () => {
      await driver.get(`${addr}/shadow-dom.html`);
      const results = await new AxeBuilder(driver)
        .exclude([['#shadow-root-1', '#shadow-button-1']])
        .exclude([['#shadow-root-2', '#shadow-button-2']])
        .analyze();
      assert.isFalse(flatPassesTargets(results).includes('#shadow-button-1'));
      assert.isFalse(flatPassesTargets(results).includes('#shadow-button-2'));
      assert.isTrue(flatPassesTargets(results).includes('#button'));
    });

    it('with labelled shadow DOM', async () => {
      await driver.get(`${addr}/shadow-dom.html`);
      const results = await new AxeBuilder(driver)
        .include({ fromShadowDom: ['#shadow-root-1', '#shadow-button-1'] })
        .exclude({ fromShadowDom: ['#shadow-root-2', '#shadow-button-2'] })
        .analyze();
      assert.isTrue(flatPassesTargets(results).includes('#shadow-button-1'));
      assert.isFalse(flatPassesTargets(results).includes('#shadow-button-2'));
    });

    it('with labelled iframe and shadow DOM', async () => {
      await driver.get(`${addr}/shadow-frames.html`);
      const { violations } = await new AxeBuilder(driver)
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

  describe('callback()', () => {
    it('returns an error as the first argument', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      assert.notEqual(title, 'Error');

      new AxeBuilder(driver, 'throw new Error()').analyze((err, results) => {
        assert.isNull(results);
        assert.isNotNull(err);
      });
    });

    it('returns as the second argument', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      assert.notEqual(title, 'Error');

      await new AxeBuilder(driver).analyze((err, results) => {
        assert.isNull(err);
        assert.isNotNull(results);
        assert.isArray(results?.violations);
        assert.isArray(results?.incomplete);
        assert.isArray(results?.passes);
        assert.isArray(results?.inapplicable);
      });
    });
  });

  describe('axe.finishRun errors', () => {
    const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;
    const windowOpenThrows = `;window.open = () => { throw new Error("No window.open")}`;

    it('throws an error if window.open throws', async () => {
      const source = axeSource + windowOpenThrows;
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      assert.notEqual(title, 'Error');

      try {
        await new AxeBuilder(driver, source).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /switchTo failed./);
      }
    });

    it('throws an error if axe.finishRun throws', async () => {
      const source = axeSource + finishRunThrows;
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      assert.notEqual(title, 'Error');

      try {
        await new AxeBuilder(driver, source).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /Please check out/);
        assert.include(
          (err as Error).message,
          'Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverjs/error-handling.md'
        );
      }
    });

    it('throw an error with modified url', async () => {
      const source = axeSource + finishRunThrows;
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      assert.notEqual(title, 'Error');

      try {
        const builder = new AxeBuilder(driver, source) as any;
        builder.errorUrl = 'https://deque.biz';
        await builder.analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /Please check out/);
        assert.include(
          (err as Error).message,
          'Please check out https://deque.biz'
        );
      }
    });
  });

  describe('setLegacyMode', () => {
    const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
    it('runs legacy mode when used', async () => {
      await driver.get(`${addr}/index.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver, axeSource + runPartialThrows)
        .setLegacyMode()
        .analyze();

      assert.notEqual(title, 'Error');
      assert.isNotNull(results);
    });

    it('prevents cross-origin frame testing', async () => {
      await driver.get(`${addr}/cross-origin.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver, axeSource + runPartialThrows)
        .withRules(['frame-tested'])
        .setLegacyMode()
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );

      assert.notEqual(title, 'Error');
      assert.ok(frameTested);
    });

    it('can be disabled again', async () => {
      await driver.get(`${addr}/cross-origin.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver)
        .withRules(['frame-tested'])
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

  describe('browser functions', () => {
    it('serializes results', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const title = await driver.getTitle();

      assert.notEqual(title, 'Error');

      await driver.executeScript(`
        window.axe = {
        runPartial: (c, o) => Promise.resolve({ violations: [], passes: [] })
        };
      `);
      const res = await axeRunPartial(driver, null as any, null as any);
      assert.equal(typeof res, 'string');
    });
  });
  describe('for versions without axe.runPartial', () => {
    let axe403Source: string;
    before(() => {
      const axe403Path = path.join(fixturesPath, 'axe-core@legacy.js');
      axe403Source = fs.readFileSync(axe403Path, 'utf8');
    });

    it('can run', async () => {
      await driver.get(`${addr}/nested-iframes.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver, axe403Source)
        .options({ runOnly: ['label'] })
        .analyze();

      assert.notEqual(title, 'Error');
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 4);
      assert.equal(results.testEngine.version, '4.2.3');
    });

    it('throws if the top level errors', done => {
      driver
        .get(`${addr}/crash.html`)
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
      await driver.get(`${addr}/nested-iframes.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver, axe403Source)
        .configure(dylangConfig)
        .analyze();

      assert.notEqual(title, 'Error');
      assert.equal(results.violations[0].id, 'dylang');
      assert.equal(results.violations[0].nodes.length, 8);
    });

    it('reports frame-tested', async () => {
      await driver.get(`${addr}/crash-parent.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(
        driver,
        axe403Source + axeCrasherSource
      )
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.notEqual(title, 'Error');
      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });

    it('tests cross-origin pages', async () => {
      await driver.get(`${addr}/cross-origin.html`);
      const title = await driver.getTitle();

      const results = await new AxeBuilder(driver, axe403Source)
        .withRules(['frame-tested'])
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );

      assert.notEqual(title, 'Error');
      assert.isUndefined(frameTested);
    });
  });

  describe('allowedOrigins', () => {
    const getAllowedOrigins = async (): Promise<string[]> => {
      return await driver.executeScript('return axe._audit.allowedOrigins');
    };

    it('should not set when running runPartial and not legacy mode', async () => {
      await driver.get(`${addr}/index.html`);
      await new AxeBuilder(driver).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
      assert.lengthOf(allowedOrigins, 1);
    });

    it('should not set when running runPartial and legacy mode', async () => {
      await driver.get(`${addr}/index.html`);
      await new AxeBuilder(driver).setLegacyMode(true).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
    });

    it('should not set when running legacy source and legacy mode', async () => {
      await driver.get(`${addr}/index.html`);
      await new AxeBuilder(driver, axeSource + axeForceLegacy)
        .setLegacyMode(true)
        .analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
    });

    it('should set when running legacy source and not legacy mode', async () => {
      await driver.get(`${addr}/index.html`);
      await new AxeBuilder(driver, axeSource + axeForceLegacy).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, ['*']);
      assert.lengthOf(allowedOrigins, 1);
    });
  });
});
