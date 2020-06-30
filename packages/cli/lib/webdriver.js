const chromedriver = require('chromedriver');
const { Builder, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

function startDriver(config) {
  let builder;
  if (config.browser === 'chrome-headless') {
    // Tell selenium use the driver in node_modules
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath || chromedriver.path
    ).build();
    chrome.setDefaultService(service);

    const args = [];
    if (config.chromeOptions) {
      args.push(...config.chromeOptions);
    }

    const chromeCapabilities = Capabilities.chrome();
    chromeCapabilities.set('chromeOptions', { args });

    builder = new Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeCapabilities)
      .setChromeOptions(new chrome.Options().headless());
  } else {
    builder = new Builder().forBrowser(config.browser);
  }
  // Launch a browser
  config.driver = builder.build();
  config.builder = builder;
  return config.driver;
}

module.exports = {
  startDriver
};
