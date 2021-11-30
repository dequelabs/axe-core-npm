const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const { version } = require('@axe-core/puppeteer/package.json');

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

  it('runs without errors', async () => {
    await page.goto('https://dequeuniversity.com/demo/mars/');
    await new AxePuppeteer(page).analyze();
  });
});
