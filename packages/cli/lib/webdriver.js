const chromedriver = require('chromedriver');
const { Builder, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function startDriver(config) {
  const scriptTimeout = (config.timeout || 20) * 1000.0;
  let builder;

  if (config.browser === 'chrome-headless') {
    // Tell selenium use the driver in node_modules
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath || chromedriver.path
    ).build();
    chrome.setDefaultService(service);

    const args = ['--headless'];
    if (config.chromeOptions) {
      args.push(...config.chromeOptions);
    }
    const chromeCapabilities = Capabilities.chrome();
    chromeCapabilities.set('chromeOptions', { args });

    builder = new Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeCapabilities);
  } else {
    builder = new Builder().forBrowser(config.browser);
  }
  // Launch a browser
  config.builder = builder;
  const driver = builder.build();
  await driver.manage().setTimeouts({ script: scriptTimeout })
  return driver;
}

module.exports = {
  startDriver
};
