const { assert } = require('chai');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const { version } = require('@axe-core/puppeteer/package.json');
const expectedVersion =
  require('../../packages/puppeteer/package.json').version;

describe(`@axe-core/puppeteer v${version}`, () => {
  let browser, page;
  before(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.setBypassCSP(true);
  });

  after(async () => {
    await browser.close();
  });

  it('matches the local version', () => {
    assert.equal(version, expectedVersion);
  });

  it('runs without errors', async () => {
    await page.goto('https://dequeuniversity.com/demo/mars/');
    await new AxePuppeteer(page).analyze();
  });
});
