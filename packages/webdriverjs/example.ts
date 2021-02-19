import AxeBuilder from './src';
import * as WebDriver from 'selenium-webdriver';

(async () => {
  const driver = new WebDriver.Builder().forBrowser('chrome').build();
  await driver.get('https://html5-sandbox.glitch.me/');
  const results = await new AxeBuilder(driver, null, {
    noSandbox: true
  }).analyze();
  console.log(results);
})();
