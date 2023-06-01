const { AxeBuilder } = require('@axe-core/playwright');
const playwright = require('playwright-core');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder({ page }).analyze();
    console.log(results);
  } catch (e) {
    console.error(e);
  }
  await browser.close();
})();