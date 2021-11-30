const { Builder } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const AxeBuilder = require('@axe-core/webdriverjs');
const { version } = require('@axe-core/webdriverjs/package.json');

describe(`@axe-core/webdriverjs v${version}`, function () {
  let driver;
  this.timeout(10000);

  before(() => {
    const options = new Options().headless();
    driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    await driver.quit();
  });

  it('runs without errors', async () => {
    await driver.get('https://deque.com');
    await new AxeBuilder(driver).analyze();
  });
});
