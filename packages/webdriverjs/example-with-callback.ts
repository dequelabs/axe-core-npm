import AxeBuilder from './src';
import * as WebDriver from 'selenium-webdriver';

const driver = new WebDriver.Builder().forBrowser('chrome').build();

driver.get('https://html5-sandbox.glitch.me/').then(() => {
  const axe = new AxeBuilder(driver, null, { noSandbox: true });
  axe.analyze((err, results) => {
    if (err) {
      // Handle error somehow
    }
    console.log(results);
  });
});
