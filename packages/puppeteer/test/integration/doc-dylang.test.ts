// Adapter from axe-webdriverjs.
// This test tests to make sure that a valid configuration works.
import 'mocha';
import { expect, assert } from 'chai';
import * as fs from 'fs';
import Puppeteer, { Browser, Page } from 'puppeteer';
import AxePuppeteer from '../../src/index';
import Axe from 'axe-core';
import { customConfig, puppeteerArgs, startServer } from '../utils';
import { Server } from 'http';

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
    const config = await customConfig();
    await page.goto(`${addr}/doc-dylang.html`);

    const results = await new AxePuppeteer(page).configure(config).analyze();

    expect(results.violations).to.have.lengthOf(1);
    expect(results.violations[0].id).to.eql('dylang');
    expect(
      results.violations[0].helpUrl.indexOf('application=axe-puppeteer')
    ).to.not.eql(-1);
    expect(results.passes).to.have.lengthOf(0);
  });

  it('configures in nested frames', async function () {
    await page.goto(`${addr}/nested-frames.html`);

    const results = await new AxePuppeteer(page)
      .configure(await customConfig())
      .analyze();

    expect(results.violations.find((r: Axe.Result) => r.id === 'dylang')).to.not
      .be.undefined;
    expect(results.violations.find((r: Axe.Result) => r.id === 'dylang'))
      .to.have.property('nodes')
      .and.to.have.lengthOf(4);
  });

  it('works without runPartial', async () => {
    const axePath = require.resolve('../fixtures/external/axe-core@legacy.js');
    const axe403Source = fs.readFileSync(axePath, 'utf8');
    const config = await customConfig();
    await page.goto(`${addr}/nested-frames.html`);
    const results = await new AxePuppeteer(page, axe403Source)
      .configure(config)
      .analyze();

    assert.equal(results.violations[0].id, 'dylang');
    assert.equal(results.violations[0].nodes.length, 4);
  });
});
