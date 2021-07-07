import 'mocha';
import * as playwright from 'playwright';
import * as express from 'express';
import type { AxeResults } from 'axe-core';
import testListen = require('test-listen');
import { assert } from 'chai';
import * as path from 'path';
import { Server, createServer } from 'http';
import AxeBuilder from '.';

describe('@axe-core/playwright', () => {
  let server: Server;
  let addr: string;
  let page: playwright.Page;
  let browser: playwright.ChromiumBrowser;

  before(async () => {
    const app = express();
    app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
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
    it('returns results', async () => {
      await page.goto(`${addr}/index.html`);
      const results = await new AxeBuilder({ page }).analyze();
      assert.isNotNull(results);
      assert.isArray(results.violations);
      assert.isArray(results.incomplete);
      assert.isArray(results.passes);
      assert.isArray(results.inapplicable);
    });
  });

  describe('disableRules', () => {
    it('disables the given rules(s) as array', async () => {
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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
      await page.goto(`${addr}/index.html`);
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

  describe('iframe tests', () => {
    it('injects into nested frames', async () => {
      await page.goto(`${addr}/nested-frames.html`);
      const results = await new AxeBuilder({ page }).analyze();
      const filterPasses = results.passes.filter(x => x.id === 'frame-tested');
      assert.strictEqual(filterPasses.length, 1);
    });

    it('injects into all iframes', async () => {
      await page.goto(`${addr}/nested-frames.html`);
      const results = await new AxeBuilder({ page }).analyze();

      assert.strictEqual(results.violations.length, 5);
      assert.strictEqual(results.violations[0].id, 'dlitem');
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
  });
});
