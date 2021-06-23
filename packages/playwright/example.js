const AxeBuilder = require('@axe-core/playwright').default;
const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://dequeuniversity.com/demo/mars/');
  const results = await new AxeBuilder({ page }).analyze();
  console.log(results);
  await browser.close();
})();
