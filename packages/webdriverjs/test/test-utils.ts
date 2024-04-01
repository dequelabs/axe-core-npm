import { WebDriver, Builder } from 'selenium-webdriver';
import chromedriver from 'chromedriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';

export const Webdriver = (): WebDriver => {
  const builder = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().addArguments('headless'))
    .setChromeService(
      new chrome.ServiceBuilder(
        process.env.CHROMEDRIVER_PATH || chromedriver.path
      )
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
