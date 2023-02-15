import 'mocha';
import fs from 'fs';
import playwright from 'playwright';
import express from 'express';
import type {
  AxeResults,
  Result,
  SerialSelector,
  SerialSelectorList
} from 'axe-core';
import testListen from 'test-listen';
import { assert } from 'chai';
import path from 'path';
import { Server, createServer } from 'http';
import AxeBuilder from '../src';
import { AxeBuilder as AxeBuilderFromNamed } from '../src';

describe('@axe-core/playwright', () => {
  let server: Server;
  let addr: string;
  let page: playwright.Page;
  const axePath = require.resolve('axe-core');
  const axeSource = fs.readFileSync(axePath, 'utf8');
  let browser: playwright.ChromiumBrowser;
  const axeTestFixtures = path.resolve(__dirname, 'fixtures');
  const externalPath = path.resolve(axeTestFixtures, 'external');
  const axeLegacySource = fs.readFileSync(
    path.join(externalPath, 'axe-core@legacy.js'),
    'utf-8'
  );
  const axeCrasherSource = fs.readFileSync(
    path.join(externalPath, 'axe-crasher.js'),
    'utf8'
  );
  const axeForceLegacy = fs.readFileSync(
    path.join(externalPath, 'axe-force-legacy.js'),
    'utf8'
  );
  const axeLargePartial = fs.readFileSync(
    path.join(externalPath, 'axe-large-partial.js'),
    'utf8'
  );

  before(async () => {
    const app = express();
    app.use(express.static(axeTestFixtures));
    server = createServer(app);
    addr = await testListen(server);
  });

  after(async () => {
    server.close();
  });

  beforeEach(async () => {
    browser = await playwright.chromium.launch({
      args: ['--disable-dev-shm-usage']
    });
    const context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should have a named export that matches the default export', () => {
    assert.equal(AxeBuilder, AxeBuilderFromNamed)
  })

  describe('analyze', () => {
    it('returns results using a different version of axe-core', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeLegacySource
      }).analyze();

      assert.equal(res?.status(), 200);
      assert.strictEqual(results.testEngine.version, '4.2.3');
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('returns results', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page }).analyze();

      assert.equal(res?.status(), 200);
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('returns correct results metadata', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page }).analyze();

      assert.equal(res?.status(), 200);
      assert.isDefined(results.testEngine.name);
      assert.isDefined(results.testEngine.version);
      assert.isDefined(results.testEnvironment.orientationAngle);
      assert.isDefined(results.testEnvironment.orientationType);
      assert.isDefined(results.testEnvironment.userAgent);
      assert.isDefined(results.testEnvironment.windowHeight);
      assert.isDefined(results.testEnvironment.windowWidth);
      assert.isDefined(results.testRunner.name);
      assert.isDefined(results.toolOptions.reporter);
      assert.equal(results.url, `${addr}/external/index.html`);
    });

    it('properly isolates the call to axe.finishRun', async () => {
      let err;
      const res = await page.goto(`${addr}/external/isolated-finish.html`);
      try {
        await new AxeBuilder({ page }).analyze();
      } catch (e) {
        err = e;
      }

      assert.equal(res?.status(), 200);
      assert.isUndefined(err);
    });

    it('handles large results', async function () {
      /* this test handles a large amount of partial results a timeout may be required */
      this.timeout(100_000);
      const res = await await page.goto(`${addr}/external/index.html`);

      assert.equal(res?.status(), 200);

      const results = await new AxeBuilder({
        page,
        axeSource: axeSource + axeLargePartial
      }).analyze();

      assert.lengthOf(results.passes, 1);
      assert.equal(results.passes[0].id, 'duplicate-id');
    });

    it('reports frame-tested', async () => {
      const res = await page.goto(`${addr}/external/crash-parent.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeSource + axeCrasherSource
      })
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.equal(res?.status(), 200);
      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });

    it('throws when injecting a problematic source', async () => {
      let error: Error | null = null;
      const res = await page.goto(`${addr}/external/crash.html`);
      try {
        await new AxeBuilder({
          page,
          axeSource: 'throw new Error()'
        }).analyze();
      } catch (e) {
        error = e as Error;
      }

      assert.equal(res?.status(), 200);
      assert.isNotNull(error);
    });

    it('throws when a setup fails', async () => {
      let error: Error | null = null;

      const brokenSource = axeSource + `;window.axe.utils = {}`;
      const res = await page.goto(`${addr}/external/index.html`);
      try {
        await new AxeBuilder({ page, axeSource: brokenSource })
          .withRules('label')
          .analyze();
      } catch (e) {
        error = e as Error;
      }

      assert.equal(res?.status(), 200);
      assert.isNotNull(error);
    });

    it('returns the same results from runPartial as from legacy mode', async () => {
      const res = await page.goto(`${addr}/external/nested-iframes.html`);
      const legacyResults = await new AxeBuilder({
        page,
        axeSource: axeSource + axeForceLegacy
      }).analyze();
      assert.equal(legacyResults.testEngine.name, 'axe-legacy');

      const normalResults = await new AxeBuilder({ page, axeSource }).analyze();
      normalResults.timestamp = legacyResults.timestamp;
      normalResults.testEngine.name = legacyResults.testEngine.name;

      /**
       * we need to stringify and parse the results as
       * deep equal thinks "messageKey": [undefined] and
       * "shadowColor": [undefined] exist, but they do not appear
       * in the results
       */
      assert.deepEqual(
        JSON.parse(JSON.stringify(normalResults)),
        JSON.parse(JSON.stringify(legacyResults))
      );
      assert.equal(res?.status(), 200);
    });
  });

  describe('disableRules', () => {
    it('disables the given rules(s) as array', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .disableRules(['region'])
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      assert.isTrue(!all.find(r => r.id === 'region'));
    });

    it('disables the given rules(s) as string', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .disableRules('region')
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      assert.isTrue(!all.find(r => r.id === 'region'));
    });
  });

  describe('withRules', () => {
    it('only runs the provided rules as an array', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .withRules(['region'])
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0].id, 'region');
    });

    it('only runs the provided rules as a string', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .withRules('region')
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0].id, 'region');
    });
  });

  describe('options', () => {
    it('passes options to axe-core', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .options({ rules: { region: { enabled: false } } })
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      assert.isTrue(!all.find(r => r.id === 'region'));
    });
  });

  describe('withTags', () => {
    it('only rules rules with the given tag(s) as an array', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .withTags(['best-practice'])
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];
      assert.equal(res?.status(), 200);
      assert.isOk(all);
      for (const rule of all) {
        assert.include(rule.tags, 'best-practice');
      }
    });

    it('only rules rules with the given tag(s) as a string', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .withTags('best-practice')
        .analyze();
      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      assert.isOk(all);
      for (const rule of all) {
        assert.include(rule.tags, 'best-practice');
      }
    });

    it('No results provided when the given tag(s) is invalid', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
        .withTags(['foobar'])
        .analyze();

      const all = [
        ...results.passes,
        ...results.inapplicable,
        ...results.violations,
        ...results.incomplete
      ];

      assert.equal(res?.status(), 200);
      // Ensure all run rules had the "foobar" tag
      assert.deepStrictEqual(0, all.length);
    });
  });

  describe('frame tests', () => {
    it('injects into nested iframes', async () => {
      const res = await page.goto(`${addr}/external/nested-iframes.html`);
      const { violations } = await new AxeBuilder({ page })
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

      assert.equal(res?.status(), 200);
      assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
    });

    it('injects into nested frameset', async () => {
      const res = await page.goto(`${addr}/external/nested-frameset.html`);
      const { violations } = await new AxeBuilder({ page })
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

      assert.equal(res?.status(), 200);
      assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
    });

    it('should work on shadow DOM iframes', async () => {
      const res = await page.goto(`${addr}/external/shadow-frames.html`);
      const { violations } = await new AxeBuilder({ page })
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(res?.status(), 200);
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

    it('injects once per iframe', async () => {
      const res = await page.goto(`${addr}/external/nested-iframes.html`);

      const builder = new AxeBuilder({ page });
      const origScript = (builder as any).script;
      let count = 0;
      Object.defineProperty(builder, 'script', {
        get() {
          count++;
          return origScript;
        }
      });

      await builder.analyze();

      assert.equal(res?.status(), 200);
      assert.strictEqual(count, 9);
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
      const res = await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .include('.include')
        .exclude('.exclude')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.equal(res?.status(), 200);
      assert.strictEqual(flattenTarget[0], '.include');
      assert.notInclude(flattenTarget, '.exclude');
    });

    it('with only include', async () => {
      const res = await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .include('.include')
        .analyze();

      assert.equal(res?.status(), 200);
      const flattenTarget = flatPassesTargets(results);
      assert.strictEqual(flattenTarget[0], '.include');
    });

    it('with only exclude', async () => {
      const res = await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .exclude('.exclude')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.equal(res?.status(), 200);
      assert.notInclude(flattenTarget, '.exclude');
    });

    it('with chaining includes', async () => {
      const res = await page.goto(`${addr}/context.html`);

      const results = await new AxeBuilder({ page })
        .include('.include')
        .include('.include2')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.equal(res?.status(), 200);
      assert.strictEqual(flattenTarget[0], '.include');
      assert.strictEqual(flattenTarget[1], '.include2');
      assert.notInclude(flattenTarget, '.exclude');
      assert.notInclude(flattenTarget, '.exclude2');
    });

    it('with chaining excludes', async () => {
      const res = await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .exclude('.exclude')
        .exclude('.exclude2')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.equal(res?.status(), 200);
      assert.notInclude(flattenTarget, '.exclude');
      assert.notInclude(flattenTarget, '.exclude2');
    });

    it('with chaining includes and excludes', async () => {
      const res = await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .include('.include')
        .include('.include2')
        .exclude('.exclude')
        .exclude('.exclude2')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.equal(res?.status(), 200);
      assert.strictEqual(flattenTarget[0], '.include');
      assert.strictEqual(flattenTarget[1], '.include2');
      assert.notInclude(flattenTarget, '.exclude');
      assert.notInclude(flattenTarget, '.exclude2');
    });

    it('with include using an array of strings', async () => {
      const res = await page.goto(`${addr}/context.html`);
      const expected = ['.selector-one', '.selector-two', '.selector-three'];

      const axeSource = `
      window.axe = {
        configure(){},
          run({ include }){
            return Promise.resolve({ include })
          }
      }
    `;
      const results = new AxeBuilder({ page, axeSource: axeSource }).include([
        '.selector-one',
        '.selector-two',
        '.selector-three'
      ]);

      const { include: actual } = (await results.analyze()) as any;

      assert.equal(res?.status(), 200);
      assert.deepEqual(actual[0], expected);
    });

    it('with exclude using an array of strings', async () => {
      const res = await page.goto(`${addr}/context.html`);
      const expected = ['.selector-one', '.selector-two', '.selector-three'];

      const axeSource = `
      window.axe = {
        configure(){},
          run({ exclude }){
            return Promise.resolve({ exclude })
          }
      }
    `;
      const results = new AxeBuilder({ page, axeSource: axeSource }).exclude([
        '.selector-one',
        '.selector-two',
        '.selector-three'
      ]);

      const { exclude: actual } = (await results.analyze()) as any;

      assert.equal(res?.status(), 200);
      assert.deepEqual(actual[0], expected);
    });

    it('with labelled frame', async () => {
      await page.goto(`${addr}/external/context-include-exclude.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/shadow-dom.html`);
      const results = await new AxeBuilder({ page })
        .include([['#shadow-root-1', '#shadow-button-1']])
        .include([['#shadow-root-2', '#shadow-button-2']])
        .analyze();
      assert.isTrue(flatPassesTargets(results).includes('#shadow-button-1'));
      assert.isTrue(flatPassesTargets(results).includes('#shadow-button-2'));
      assert.isFalse(flatPassesTargets(results).includes('#button'));
    });

    it('with exclude shadow DOM', async () => {
      await page.goto(`${addr}/external/shadow-dom.html`);
      const results = await new AxeBuilder({ page })
        .exclude([['#shadow-root-1', '#shadow-button-1']])
        .exclude([['#shadow-root-2', '#shadow-button-2']])
        .analyze();
      assert.isFalse(flatPassesTargets(results).includes('#shadow-button-1'));
      assert.isFalse(flatPassesTargets(results).includes('#shadow-button-2'));
      assert.isTrue(flatPassesTargets(results).includes('#button'));
    });

    it('with labelled shadow DOM', async () => {
      await page.goto(`${addr}/external/shadow-dom.html`);
      const results = await new AxeBuilder({ page })
        .include({ fromShadowDom: ['#shadow-root-1', '#shadow-button-1'] })
        .exclude({ fromShadowDom: ['#shadow-root-2', '#shadow-button-2'] })
        .analyze();
      assert.isTrue(flatPassesTargets(results).includes('#shadow-button-1'));
      assert.isFalse(flatPassesTargets(results).includes('#shadow-button-2'));
    });

    it('with labelled iframe and shadow DOM', async () => {
      await page.goto(`${addr}/external/shadow-frames.html`);
      const { violations } = await new AxeBuilder({ page })
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

  describe('axe.finishRun errors', () => {
    const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;

    it('throws an error if axe.finishRun throws', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      delete page.context().newPage;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      page.context().newPage = () => {
        return null;
      };

      assert.equal(res?.status(), 200);
      try {
        await new AxeBuilder({
          page,
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
          'Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md'
        );
      }
    });

    it('throw an error with modified url', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      delete page.context().newPage;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      page.context().newPage = () => {
        return null;
      };

      assert.equal(res?.status(), 200);
      try {
        const builder = new AxeBuilder({
          page,
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
      const res = await page.goto(`${addr}/external/index.html`);

      assert.equal(res?.status(), 200);
      try {
        await new AxeBuilder({
          page,
          axeSource: axeSource + finishRunThrows
        }).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /Please check out/);
      }
    });
  });

  describe('errorUrl', () => {
    it('returns correct errorUrl', () => {
      const errorUrl = (new AxeBuilder({ page }) as any).errorUrl;
      assert.equal(
        errorUrl,
        'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md'
      );
    });
  });

  describe('setLegacyMode', () => {
    const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
    it('runs legacy mode when used', async () => {
      const res = await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeSource + runPartialThrows
      })
        .setLegacyMode()
        .analyze();

      assert.equal(res?.status(), 200);
      assert.isNotNull(results);
    });

    it('prevents cross-origin frame testing', async () => {
      const res = await page.goto(`${addr}/external/cross-origin.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeSource + runPartialThrows
      })
        .withRules('frame-tested')
        .setLegacyMode()
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );
      assert.equal(res?.status(), 200);
      assert.ok(frameTested);
    });

    it('can be disabled again', async () => {
      const res = await page.goto(`${addr}/external/cross-origin.html`);
      const results = await new AxeBuilder({ page })
        .withRules('frame-tested')
        .setLegacyMode()
        .setLegacyMode(false)
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );
      assert.equal(res?.status(), 200);
      assert.isUndefined(frameTested);
    });
  });

  describe('for versions without axe.runPartial', () => {
    describe('analyze', () => {
      it('returns results', async () => {
        const res = await page.goto(`${addr}/external/index.html`);
        const results = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        }).analyze();

        assert.equal(res?.status(), 200);
        assert.strictEqual(results.testEngine.version, '4.2.3');
        assert.isNotNull(results);
        assert.isArray(results.violations);
        assert.isArray(results.incomplete);
        assert.isArray(results.passes);
        assert.isArray(results.inapplicable);
      });

      it('throws if axe errors out on the top window', async () => {
        let error: Error | null = null;
        const res = await page.goto(`${addr}/external/crash.html`);
        try {
          await new AxeBuilder({
            page,
            axeSource: axeLegacySource + axeCrasherSource
          }).analyze();
        } catch (e) {
          error = e as Error;
        }

        assert.equal(res?.status(), 200);
        assert.isNotNull(error);
      });

      it('tests cross-origin pages', async () => {
        const res = await page.goto(`${addr}/external/cross-origin.html`);
        const results = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        })
          .withRules('frame-tested')
          .analyze();

        const frameTested = results.incomplete.find(
          ({ id }) => id === 'frame-tested'
        );

        assert.equal(res?.status(), 200);
        assert.isUndefined(frameTested);
      });
    });

    describe('frame tests', () => {
      it('injects into nested iframes', async () => {
        const res = await page.goto(`${addr}/external/nested-iframes.html`);
        const { violations } = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        })
          .withRules('label')
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

        assert.equal(res?.status(), 200);
        assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
        assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
        assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
      });

      it('injects into nested frameset', async () => {
        const res = await page.goto(`${addr}/external/nested-frameset.html`);
        const { violations } = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        })
          .withRules('label')
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

        assert.equal(res?.status(), 200);
        assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
        assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
        assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
      });

      it('should work on shadow DOM iframes', async () => {
        const res = await page.goto(`${addr}/external/shadow-frames.html`);
        const { violations } = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        })
          .withRules('label')
          .analyze();

        assert.equal(violations[0].id, 'label');
        assert.lengthOf(violations[0].nodes, 3);

        const nodes = violations[0].nodes;

        assert.equal(res?.status(), 200);
        assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
        assert.deepEqual(nodes[1].target, [
          ['#shadow-root', '#shadow-frame'],
          'input'
        ]);
        assert.deepEqual(nodes[2].target, ['#slotted-frame', 'input']);
      });
    });
  });

  describe('allowedOrigins', () => {
    const getAllowedOrigins = async (): Promise<string[]> => {
      return await page.evaluate('axe._audit.allowedOrigins');
    };

    it('should not set when running runPartial and not legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxeBuilder({ page }).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
      assert.lengthOf(allowedOrigins, 1);
    });

    it('should not set when running runPartial and legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxeBuilder({ page }).setLegacyMode(true).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
      assert.lengthOf(allowedOrigins, 1);
    });

    it('should not set when running legacy source and legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxeBuilder({ page, axeSource: axeLegacySource })
        .setLegacyMode(true)
        .analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
      assert.lengthOf(allowedOrigins, 1);
    });

    it('should set when running legacy source and not legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxeBuilder({
        page,
        axeSource: axeLegacySource
      }).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, ['*']);
      assert.lengthOf(allowedOrigins, 1);
    });
  });
});
