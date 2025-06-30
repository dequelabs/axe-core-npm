const { AxeBuilder } = require('@axe-core/playwright');
const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({
    headless: false,
    use: {
      video: 'on',
      screenshot: 'on',
      trace: 'on'
    }
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder({ page })
      .options({ checks: { 'valid-lang': 'orcish' } })
      .analyze();
    console.log(results);
  } catch (e) {
    console.error(e);
  }

  await browser.close();
})();
