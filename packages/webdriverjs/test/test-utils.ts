import { WebDriver, Builder } from 'selenium-webdriver';
import chromedriver from 'chromedriver';
import chrome from 'selenium-webdriver/chrome';

export const Webdriver = (): WebDriver => {
  const builder = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().headless())
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
