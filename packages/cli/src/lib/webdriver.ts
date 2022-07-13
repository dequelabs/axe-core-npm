import chromedriver from 'chromedriver';
import { Builder, Capabilities, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { WebdriverConfigParams } from '../types';

const startDriver = async (
  config: WebdriverConfigParams
): Promise<WebDriver> => {
  const scriptTimeout = (config.timeout || 20) * 1000.0;
  let builder: Builder;
  /* istanbul ignore else */
  if (config.browser === 'chrome-headless') {
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath || chromedriver.path
    ).build();
    // Pinned to selenium-webdriver@4.3.0
    // https://github.com/SeleniumHQ/selenium/pull/10796/files#diff-6c87d95a2288e92e15a6bb17710c763c01c2290e679beb26220858f3218b6a62L260
    chrome.setDefaultService(service);

    let options = new chrome.Options().headless();
    if (config.chromeOptions?.length) {
      options = config.chromeOptions.reduce(function (options, arg) {
        return options.addArguments(arg);
      }, options);
    }

    builder = new Builder().forBrowser('chrome').setChromeOptions(options);
  } else {
    builder = new Builder().forBrowser(config.browser);
  }

  config.builder = builder;
  const driver = builder.build();
  await driver.manage().setTimeouts({ script: scriptTimeout });
  return driver;
};

export { startDriver };
