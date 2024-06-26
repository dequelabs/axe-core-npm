import { WebDriver, Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { config } from 'dotenv';
import os from 'os';
import path from 'path';
import { assert } from 'chai';

const HOME_DIR = os.homedir();
const BDM_CACHE_DIR = path.resolve(HOME_DIR, '.browser-driver-manager');

config({ path: path.resolve(BDM_CACHE_DIR, '.env') });

export const Webdriver = (): WebDriver => {
  assert(
    process.env.CHROME_TEST_PATH,
    'CHROME_TEST_PATH is not set. Run `npx browser-driver-manager install chrome`'
  );
  assert(
    process.env.CHROMEDRIVER_TEST_PATH,
    'CHROMEDRIVER_TEST_PATH is not set. Run `npx browser-driver-manager install chrome`'
  );
  // Weird type change since 4.23.1 release
  // @see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69724
  const options = new chrome.Options();
  options.addArguments('headless');
  options.setBinaryPath(process.env.CHROME_TEST_PATH as string);

  const builder = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(
      new chrome.ServiceBuilder(process.env.CHROMEDRIVER_TEST_PATH)
    );

  if (process.env.REMOTE_SELENIUM_URL) {
    builder.usingServer(process.env.REMOTE_SELENIUM_URL);
  }

  return builder.build();
};

export const FirefoxDriver = (): WebDriver => {
  return new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options().addArguments('--headless'))
    .build();
};

export const SafariDriver = (): WebDriver => {
  return new Builder().forBrowser('safari').build();
};
