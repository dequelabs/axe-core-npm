import 'mocha';
import * as fs from 'fs';
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
  const axeTestFixtures = path.resolve(
    __dirname,
    '..',
    'node_modules',
    'axe-test-fixtures',
    'fixtures'
  );
  const axeSource = fs.readFileSync(
    path.resolve(axeTestFixtures, 'axe-core@legacy.js'),
    'utf-8'
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

  describe('axe-core@4.0.3', () => {
    describe('frame tests', () => {
      it('injects into nested iframes', async () => {
        await page.goto(`${addr}/nested-iframes.html`);
        const { violations } = await new AxeBuilder({ page, axeSource })
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
        await page.goto(`${addr}/nested-frameset.html`);
        const { violations } = await new AxeBuilder({ page, axeSource })
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
        await page.goto(`${addr}/shadow-frames.html`);
        const { violations } = await new AxeBuilder({ page, axeSource })
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

  describe('axe-core@4.3.2+', () => {
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

    describe('frame tests', () => {
      it('injects into nested iframes', async () => {
        await page.goto(`${addr}/nested-iframes.html`);
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
        await page.goto(`${addr}/nested-frameset.html`);
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
        await page.goto(`${addr}/shadow-frames.html`);
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
});
