// Adapter from axe-webdriverjs.
// This test tests to make sure that a valid configuration works.
import 'mocha';
import { assert } from 'chai';
import * as fs from 'fs';
import Puppeteer, { Browser, Page } from 'puppeteer';
import AxePuppeteer from '../../src/index';
import { puppeteerArgs, startServer } from '../utils';
import { Server } from 'http';

const dylangConfig = JSON.parse(
  fs.readFileSync(
    require.resolve('../fixtures/external/dylang-config.json'),
    'utf8'
  )
);

describe('doc-dylang.html', function () {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let addr: string;

  this.timeout(10000);

  before(async () => {
    const args = puppeteerArgs();
    browser = await Puppeteer.launch({ args });
    ({ server, addr } = await startServer());
  });

  after(async function () {
    await browser.close();
    server.close();
  });

  beforeEach(async function () {
    page = await browser.newPage();
  });

  afterEach(async function () {
    await page.close();
  });

  it('should find violations with customized helpUrl', async function () {
    await page.goto(`${addr}/external/index.html`);
    const { violations, passes } = await new AxePuppeteer(page)
      .configure(dylangConfig)
      .analyze();

    assert.lengthOf(passes, 0);
    assert.lengthOf(violations, 1);
    assert.equal(violations[0].id, 'dylang');
    assert.lengthOf(violations[0].nodes, 1);
  });

  it('configures in nested frames', async function () {
    await page.goto(`${addr}/external/nested-iframes.html`);
    const { violations } = await new AxePuppeteer(page)
      .configure(dylangConfig)
      .analyze();

    assert.lengthOf(violations, 1);
    assert.equal(violations[0].id, 'dylang');
    assert.lengthOf(violations[0].nodes, 8);
  });

  it('works without runPartial', async () => {
    const axePath = require.resolve('../fixtures/external/axe-core@legacy.js');
    const axe403Source = fs.readFileSync(axePath, 'utf8');
    await page.goto(`${addr}/external/nested-iframes.html`);
    const { violations } = await new AxePuppeteer(page, axe403Source)
      .configure(dylangConfig)
      .analyze();

    assert.lengthOf(violations, 1);
    assert.equal(violations[0].id, 'dylang');
    assert.lengthOf(violations[0].nodes, 8);
  });
});
