import { WebDriver, Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { assert } from 'chai';

export const Webdriver = (): WebDriver => {
  assert(
    process.env.CHROME_TEST_PATH,
    [
      'CHROME_TEST_PATH is not set.',
      'Install Chrome: npx @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer-browsers',
      'The command prints the resolved binary path; export it as CHROME_TEST_PATH.',
      'e.g. export CHROME_TEST_PATH="$(npx @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer-browsers | awk \'{print $2}\')"'
    ].join('\n')
  );
  assert(
    process.env.CHROMEDRIVER_TEST_PATH,
    [
      'CHROMEDRIVER_TEST_PATH is not set.',
      'Install ChromeDriver: npx @puppeteer/browsers install chromedriver@stable --path ~/.cache/puppeteer-browsers',
      'The command prints the resolved binary path; export it as CHROMEDRIVER_TEST_PATH.',
      'e.g. export CHROMEDRIVER_TEST_PATH="$(npx @puppeteer/browsers install chromedriver@stable --path ~/.cache/puppeteer-browsers | awk \'{print $2}\')"'
    ].join('\n')
  );
  // Weird type change since 4.23.1 release
  // @see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69724
  const options = new chrome.Options();
  options
    .addArguments('headless')
    // Required for CI runners using >=Ubuntu 24.04
    // @see https://github.com/SeleniumHQ/selenium/issues/14609
    .addArguments('no-sandbox');

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
