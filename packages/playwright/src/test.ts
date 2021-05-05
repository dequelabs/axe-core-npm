import 'mocha';
import * as playwright from 'playwright';
import * as express from 'express';
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

  beforeEach(async () => {
    const app = express();
    app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
    server = createServer(app);
    addr = await testListen(server);
    browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await browser.close();
    server.close();
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
      assert.strictEqual(results.incomplete.length, 0);
    });

    it('injects into all iframes', async () => {
      await page.goto(`${addr}/nested-frames.html`);
      const results = await new AxeBuilder({ page }).analyze();

      assert.strictEqual(results.violations.length, 5);
      assert.strictEqual(results.violations[0].id, 'dlitem');
    });
  });

  describe('include/exclude', () => {
    it('with include and exclude', async () => {
      let error: Error | null = null;
      await page.goto(`${addr}/context.html`);
      const builder = new AxeBuilder({ page })
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
      await page.goto(`${addr}/context.html`);
      const builder = new AxeBuilder({ page }).include('.include');

      try {
        await builder.analyze();
      } catch (e) {
        error = e;
      }

      assert.strictEqual(error, null);
    });

    it('wth only exclude', async () => {
      let error: Error | null = null;
      await page.goto(`${addr}/context.html`);
      const builder = new AxeBuilder({ page }).exclude('.exclude');

      try {
        await builder.analyze();
      } catch (e) {
        error = e;
      }

      assert.strictEqual(error, null);
    });
  });
});
