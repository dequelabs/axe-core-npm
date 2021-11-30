const playwright = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const { version } = require('@axe-core/playwright/package.json');

describe(`@axe-core/playwright v${version}`, () => {
  let browser, page;
  before(async () => {
    browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    page = await context.newPage();
  });

  after(async () => {
    await browser.close();
  });

  it('runs without errors', async () => {
    await page.goto('https://dequeuniversity.com/demo/mars/');
    await new AxeBuilder({ page }).analyze();
  });
});
