var WebDriver = require('selenium-webdriver');
var chromeCapabilities = WebDriver.Capabilities.chrome();

function runWebdriver() {
  var webdriver;
  // Adding this should fix the weird CI failing issue
  // https://github.com/SeleniumHQ/selenium/issues/4961
  var chromeOptions = {
    args: ['--no-sandbox', '--headless', '--disable-gpu']
  };
  chromeCapabilities.set('chromeOptions', chromeOptions);
  if (process.env.REMOTE_SELENIUM_URL) {
    webdriver = new WebDriver.Builder()
      .forBrowser('chrome')
      .usingServer(process.env.REMOTE_SELENIUM_URL)
      .build();
  } else {
    webdriver = new WebDriver.Builder()
      .withCapabilities(chromeCapabilities)
      .forBrowser('chrome')
      .build();
  }

  return webdriver;
}

module.exports = runWebdriver;
