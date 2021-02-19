import { WebDriver, Capabilities, Builder } from 'selenium-webdriver';
const chromeCapabilities = Capabilities.chrome();

export default (): WebDriver => {
  let webdriver: WebDriver;
  const chromeOptions = {
    args: ['--no-sandbox', '--headless', '--disable-gpu']
  };
  chromeCapabilities.set('chromeOptions', chromeOptions);
  if (process.env.REMOTE_SELENIUM_URL) {
    webdriver = new Builder()
      .forBrowser('chrome')
      .usingServer(process.env.REMOTE_SELENIUM_URL)
      .build();
  } else {
    webdriver = new Builder()
      .withCapabilities(chromeCapabilities)
      .forBrowser('chrome')
      .build();
  }
  return webdriver;
};
