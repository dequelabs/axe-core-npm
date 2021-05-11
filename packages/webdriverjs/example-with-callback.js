const AxeBuilder = require('@axe-core/webdriverjs');
const WebDriver = require('selenium-webdriver');

const driver = new WebDriver.Builder().forBrowser('chrome').build();

driver.get('https://html5-sandbox.glitch.me/').then(() => {
  const axe = new AxeBuilder(driver, null, { noSandbox: true });
  axe.analyze(async (err, results) => {
    if (err) {
      // Handle error somehow
    }
    console.log(results);
    await driver.quit();
  });
});
