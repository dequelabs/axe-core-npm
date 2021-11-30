import 'mocha';
import * as fs from 'fs';
import * as playwright from 'playwright';
import * as express from 'express';
import type { AxeResults } from 'axe-core';
import testListen = require('test-listen');
import { assert } from 'chai';
import * as path from 'path';
import { Server, createServer } from 'http';
import AxeBuilder from '../src';

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

  describe('analyze', () => {
    it('returns results using a different version of axe-core', async () => {
      await page.goto(`${addr}/index.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeLegacySource
      }).analyze();
      assert.strictEqual(results.testEngine.version, '4.0.3');
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('returns results', async () => {
      await page.goto(`${addr}/index.html`);
      const results = await new AxeBuilder({ page }).analyze();
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });

    it('returns correct results metadata', async () => {
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page }).analyze();
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
      await page.goto(`${addr}/external/isolated-finish.html`);
      try {
        await new AxeBuilder({ page }).analyze();
      } catch (e) {
        err = e;
      }
      assert.isUndefined(err);
    });

    it('reports frame-tested', async () => {
      await page.goto(`${addr}/external/crash-parent.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeSource + axeCrasherSource
      })
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();
      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });

    it('throws when injecting a problematic source', async () => {
      let error: Error | null = null;
      await page.goto(`${addr}/external/crash-me.html`);
      try {
        await new AxeBuilder({
          page,
          axeSource: 'throw new Error()'
        }).analyze();
      } catch (e) {
        error = e as Error;
      }
      assert.isNotNull(error);
    });

    it('throws when a setup fails', async () => {
      let error: Error | null = null;

      const brokenSource = axeSource + `;window.axe.utils = {}`;
      await page.goto(`${addr}/external/index.html`);
      try {
        await new AxeBuilder({ page, axeSource: brokenSource })
          .withRules('label')
          .analyze();
      } catch (e) {
        error = e as Error;
      }

      assert.isNotNull(error);
    });

    it('returns the same results from runPartial as from legacy mode', async () => {
      await page.goto(`${addr}/nested-iframes.html`);
      const legacyResults = await new AxeBuilder({
        page,
        axeSource: axeSource + axeForceLegacy
      }).analyze();
      assert.equal(legacyResults.testEngine.name, 'axe-legacy');

      const normalResults = await new AxeBuilder({ page, axeSource }).analyze();
      normalResults.timestamp = legacyResults.timestamp;
      normalResults.testEngine.name = legacyResults.testEngine.name;
      assert.deepEqual(normalResults, legacyResults);
    });
  });

  describe('disableRules', () => {
    it('disables the given rules(s) as array', async () => {
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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

  describe('withRules', () => {
    it('only runs the provided rules as an array', async () => {
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({ page })
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

  describe('frame tests', () => {
    it('injects into nested iframes', async () => {
      await page.goto(`${addr}/external/nested-iframes.html`);
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
      assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
    });

    it('injects into nested frameset', async () => {
      await page.goto(`${addr}/external/nested-frameset.html`);
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
      assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
    });

    it('should work on shadow DOM iframes', async () => {
      await page.goto(`${addr}/external/shadow-frames.html`);
      const { violations } = await new AxeBuilder({ page })
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

    it('injects once per iframe', async () => {
      await page.goto(`${addr}/external/nested-iframes.html`);

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
          return acc.concat(node.target);
        }, []);
    };
    it('with include and exclude', async () => {
      await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .include('.include')
        .exclude('.exclude')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.strictEqual(flattenTarget[0], '.include');
      assert.notInclude(flattenTarget, '.exclude');
    });

    it('with only include', async () => {
      await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .include('.include')
        .analyze();
      const flattenTarget = flatPassesTargets(results);
      assert.strictEqual(flattenTarget[0], '.include');
    });

    it('with only exclude', async () => {
      await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .exclude('.exclude')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.notInclude(flattenTarget, '.exclude');
    });

    it('with chaining includes', async () => {
      await page.goto(`${addr}/context.html`);

      const results = await new AxeBuilder({ page })
        .include('.include')
        .include('.include2')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.strictEqual(flattenTarget[0], '.include');
      assert.strictEqual(flattenTarget[1], '.include2');
      assert.notInclude(flattenTarget, '.exclude');
      assert.notInclude(flattenTarget, '.exclude2');
    });

    it('with chaining excludes', async () => {
      await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .exclude('.exclude')
        .exclude('.exclude2')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.notInclude(flattenTarget, '.exclude');
      assert.notInclude(flattenTarget, '.exclude2');
    });

    it('with chaining includes and excludes', async () => {
      await page.goto(`${addr}/context.html`);
      const results = await new AxeBuilder({ page })
        .include('.include')
        .include('.include2')
        .exclude('.exclude')
        .exclude('.exclude2')
        .analyze();
      const flattenTarget = flatPassesTargets(results);

      assert.strictEqual(flattenTarget[0], '.include');
      assert.strictEqual(flattenTarget[1], '.include2');
      assert.notInclude(flattenTarget, '.exclude');
      assert.notInclude(flattenTarget, '.exclude2');
    });

    it('with include using an array of strings', async () => {
      await page.goto(`${addr}/context.html`);
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

      assert.deepEqual(actual[0], expected);
    });

    it('with exclude using an array of strings', async () => {
      await page.goto(`${addr}/context.html`);
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

      assert.deepEqual(actual[0], expected);
    });
  });

  describe('axe.finishRun errors', () => {
    const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;

    it('throws an error if axe.finishRun throws', async () => {
      await page.goto(`${addr}/external/index.html`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore
      delete page.context().newPage;
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore
      page.context().newPage = () => {
        return null;
      };

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
      }
    });

    it('throws an error if axe.finishRun throws', async () => {
      await page.goto(`${addr}/external/index.html`);

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

  describe('setLegacyMode', () => {
    const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
    it('runs legacy mode when used', async () => {
      await page.goto(`${addr}/external/index.html`);
      const results = await new AxeBuilder({
        page,
        axeSource: axeSource + runPartialThrows
      })
        .setLegacyMode()
        .analyze();
      assert.isNotNull(results);
    });

    it('prevents cross-origin frame testing', async () => {
      await page.goto(`${addr}/external/cross-origin.html`);
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
      assert.ok(frameTested);
    });

    it('can be disabled again', async () => {
      await page.goto(`${addr}/external/cross-origin.html`);
      const results = await new AxeBuilder({ page })
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

  describe('for versions without axe.runPartial', () => {
    describe('analyze', () => {
      it('returns results', async () => {
        await page.goto(`${addr}/external/index.html`);
        const results = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        }).analyze();
        assert.strictEqual(results.testEngine.version, '4.0.3');
        assert.isNotNull(results);
        assert.isArray(results.violations);
        assert.isArray(results.incomplete);
        assert.isArray(results.passes);
        assert.isArray(results.inapplicable);
      });

      it('throws if axe errors out on the top window', async () => {
        let error: Error | null = null;
        await page.goto(`${addr}/external/crash.html`);
        try {
          await new AxeBuilder({
            page,
            axeSource: axeLegacySource + axeCrasherSource
          }).analyze();
        } catch (e) {
          error = e as Error;
        }
        assert.isNotNull(error);
      });

      it('tests cross-origin pages', async () => {
        await page.goto(`${addr}/external/cross-origin.html`);
        const results = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        })
          .withRules('frame-tested')
          .analyze();

        const frameTested = results.incomplete.find(
          ({ id }) => id === 'frame-tested'
        );
        assert.isUndefined(frameTested);
      });
    });

    describe('frame tests', () => {
      it('injects into nested iframes', async () => {
        await page.goto(`${addr}/external/nested-iframes.html`);
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
        assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
        assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
        assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
      });

      it('injects into nested frameset', async () => {
        await page.goto(`${addr}/external/nested-frameset.html`);
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
        assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
        assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
        assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
      });

      it('should work on shadow DOM iframes', async () => {
        await page.goto(`${addr}/external/shadow-frames.html`);
        const { violations } = await new AxeBuilder({
          page,
          axeSource: axeLegacySource
        })
          .withRules('label')
          .analyze();

        assert.equal(violations[0].id, 'label');
        assert.lengthOf(violations[0].nodes, 3);

        const nodes = violations[0].nodes;
        assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
        assert.deepEqual(nodes[1].target, ['#slotted-frame', 'input']);
        assert.deepEqual(nodes[2].target, [
          ['#shadow-root', '#shadow-frame'],
          'input'
        ]);
      });
    });
  });
});
