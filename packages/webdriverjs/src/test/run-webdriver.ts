import { WebDriver, Builder } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

export default (): WebDriver => {
  let webdriver: WebDriver;
  if (process.env.REMOTE_SELENIUM_URL) {
    webdriver = new Builder()
      .forBrowser('chrome')
      .usingServer(process.env.REMOTE_SELENIUM_URL)
      .setChromeOptions(new chrome.Options().headless())
      .build();
  } else {
    webdriver = new Builder()
      .setChromeOptions(new chrome.Options().headless())
      .forBrowser('chrome')
      .build();
  }
  return webdriver;
};
