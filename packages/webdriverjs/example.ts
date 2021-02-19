import AxeBuilder from './dist';
import * as WebDriver from 'selenium-webdriver';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
(async () => {
  const driver = new WebDriver.Builder().forBrowser('chrome').build();
  await driver.get('https://html5-sandbox.glitch.me/');
  const results = await new AxeBuilder(driver, null, {
    noSandbox: true
  }).analyze();
  console.log(results);
})();
