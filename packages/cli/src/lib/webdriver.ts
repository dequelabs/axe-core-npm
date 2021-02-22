import * as chromedriver from 'chromedriver';
import { Builder, Capabilities, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const startDriver = async (config: any): Promise<WebDriver> => {
  const scriptTimeout = (config.timeout || 20) * 1000.0;
  let builder: Builder;
  const args: chrome.Options[] = [];
  /* istanbul ignore else */
  if (config.browser === 'chrome-headless') {
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath || chromedriver.path
    ).build();
    chrome.setDefaultService(service);
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

  config.builder = builder;
  const driver = builder.build();
  await driver.manage().setTimeouts({ script: scriptTimeout });
  return driver;
};

export { startDriver };
