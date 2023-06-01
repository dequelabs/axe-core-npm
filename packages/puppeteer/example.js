const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxePuppeteer(page).analyze();
    console.log(results);
  } catch (e) {
    console.error(e);
  }

  await page.close();
  await browser.close();
})();