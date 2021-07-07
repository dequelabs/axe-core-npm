import 'mocha';

import { assert } from 'chai';
import Puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import AxePuppeteer from '../../src/index';
import express from 'express';
import { createServer, Server } from 'http';
import testListen from 'test-listen';

describe('runPartial', () => {
  let page: Page;
  let browser: Browser;
  let server: Server;
  let base: string;

  // TODO: Use shadow DOM in some of these

  before(async function () {
    this.timeout(10000);
    const args = [];
    if (process.env.CI) {
      args.push('--no-sandbox', '--disable-setuid-sandbox');
    }
    browser = await Puppeteer.launch({ args });
  });

  after(async function () {
    await browser.close();
  });

  before(async function () {
    const app: express.Application = express();
    app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
    server = createServer(app);
    base = await testListen(server);
  });

  after(function () {
    server.close();
  });

  beforeEach(async function () {
    page = await browser.newPage();
  });

  afterEach(async function () {
    await page.close();
  });

  describe('after-method', () => {
    const ruleName = 'heading-order';
    beforeEach(async () => {
      await page.goto(`${base}/after-method.html`);
    });

    it('passes a complex "after" method', async () => {
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      const results = await axe.newAnalyze();

      assert.lengthOf(results.violations, 0);
      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 1);
      assert.lengthOf(results.passes[0].nodes, 4);
    });

    it('fails a complex "after" method', async () => {
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      axe.exclude(['#frame1', '#frame1a']);
      const results = await axe.newAnalyze();

      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 1);
      assert.lengthOf(results.passes[0].nodes, 2);
      assert.lengthOf(results.violations, 1);
      assert.lengthOf(results.violations[0].nodes, 1);
    });
  });

  describe('context-size-focusable', () => {
    const ruleName = 'frame-focusable-content';
    beforeEach(async () => {
      await page.goto(`${base}/context-size-focusable.html`);
    });

    it('passes when context.size and context.focusable are used', async () => {
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      axe.exclude(['#fail1']);
      axe.exclude(['#fail2', 'iframe']);
      const results = await axe.newAnalyze();

      assert.lengthOf(results.violations, 0);
      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 1);
      assert.lengthOf(results.passes[0].nodes, 2);
    });

    it('fails when context.size and context.focusable are used', async () => {
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      const results = await axe.newAnalyze();

      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 1);
      assert.lengthOf(results.passes[0].nodes, 2);
      assert.lengthOf(results.violations, 1);
      assert.lengthOf(results.violations[0].nodes, 2);
    });
  });

  describe('initiator', () => {
    const ruleName = 'document-title';

    it('passes when the initiator passes, even if its frames fail', async () => {
      await page.goto(`${base}/initiator-pass.html`);
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      const results = await axe.newAnalyze();

      assert.lengthOf(results.violations, 0);
      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 1);
      assert.lengthOf(results.passes[0].nodes, 1);
    });

    it('fails when the initiator fails', async () => {
      await page.goto(`${base}/initiator-fail.html`);
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      const results = await axe.newAnalyze();

      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 0);
      assert.lengthOf(results.violations, 1);
      assert.lengthOf(results.violations[0].nodes, 1);
    });
  });

  describe('page-level', () => {
    const ruleName = 'bypass';
    beforeEach(async () => {
      await page.goto(`${base}/page-level.html`);
    });

    it('skips when only testing a section of the page', async () => {
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      axe.include(['article']);
      const results = await axe.newAnalyze();

      assert.lengthOf(results.violations, 0);
      assert.lengthOf(results.incomplete, 0);
      assert.lengthOf(results.passes, 0);
    });

    it('finds issues when testing the entire page', async () => {
      const axe = new AxePuppeteer(page);
      axe.options({ runOnly: ruleName });
      axe.include(':root');
      const results = await axe.newAnalyze();

      assert.lengthOf(results.violations, 0);
      assert.lengthOf(results.passes, 0);
      assert.lengthOf(results.incomplete, 1);
      assert.lengthOf(results.incomplete[0].nodes, 1);
    });
  });
});
