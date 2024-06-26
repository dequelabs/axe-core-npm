import path from 'path';
import chromedriver from 'chromedriver';
import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { WebdriverConfigParams } from '../types';
import { CHROME_TEST_PATH, CHROMEDRIVER_TEST_PATH } from './utils';

const startDriver = async (
  config: WebdriverConfigParams
): Promise<WebDriver> => {
  const scriptTimeout = config.timeout * 1000.0;
  let builder: Builder;
  /* istanbul ignore else */
  if (config.browser === 'chrome-headless') {
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath ?? CHROMEDRIVER_TEST_PATH ?? chromedriver.path
    );

    let options = new chrome.Options();
    // selenium-webdriver < 4.17.0
    if ('headless' in options && typeof options.headless === 'function') {
      options.headless();
    }
    // selenium-webdriver >= 4.17.0
    else {
      options.addArguments('headless');
    }

    if (config.chromeOptions?.length) {
      options = config.chromeOptions.reduce(function (options, arg) {
        options.addArguments(arg);
        return options;
      }, options);
    }

    if (CHROME_TEST_PATH) {
      options.setChromeBinaryPath(path.resolve(CHROME_TEST_PATH));
    }

    if (config.chromePath) {
      options.setChromeBinaryPath(path.resolve(config.chromePath));
    }

    builder = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service);
  } else {
    builder = new Builder().forBrowser(config.browser);
  }

  config.builder = builder;
  const driver = builder.build();
  await driver.manage().setTimeouts({ script: scriptTimeout });
  return driver;
};

export { startDriver };
