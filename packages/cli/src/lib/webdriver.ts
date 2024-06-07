import path from 'path';
import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { WebdriverConfigParams } from '../types';
import { config } from 'dotenv';
import os from 'os';

const HOME_DIR = os.homedir();
const BDM_CACHE_DIR = path.resolve(HOME_DIR, '.browser-driver-manager');

config({ path: path.resolve(BDM_CACHE_DIR, '.env') });

const startDriver = async (
  config: WebdriverConfigParams
): Promise<WebDriver> => {
  const scriptTimeout = config.timeout * 1000.0;
  let builder: Builder;
  /* istanbul ignore else */
  if (config.browser === 'chrome-headless') {
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath || process.env.CHROMEDRIVER_TEST_PATH
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

    if (config.chromePath) {
      options.setChromeBinaryPath(path.resolve(config.chromePath));
    } else {
      // TODO: write a test for this
      options.setChromeBinaryPath(process.env.CHROME_TEST_PATH as string);
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
