const { AxeBuilder } = require('@axe-core/webdriverjs');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async () => {
  const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().headless())
    .build();
  await driver.get('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder(driver).analyze();
    console.log(results);
  } catch(e) {
    console.error(e);
  }

  await driver.quit();
})();
