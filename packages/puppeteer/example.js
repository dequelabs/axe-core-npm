const { AxePuppeteer } = require('./dist/index');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setBypassCSP(true);

  await page.goto('https://origprod-taos-frontend.pgmodernweb.com/');

  try {
    const { incomplete, violations } = await new AxePuppeteer({ page }).analyze();
    console.log({ incomplete, violations });
  } finally {
    await page.close();
    await browser.close();
  }
})();