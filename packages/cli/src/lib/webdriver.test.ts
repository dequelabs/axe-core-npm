import 'mocha';
import { assert } from 'chai';
import { startDriver } from './webdriver';
import { WebDriver } from 'selenium-webdriver';
import chromedriver from 'chromedriver';
import chrome from 'selenium-webdriver/chrome';
import type { Options } from 'selenium-webdriver/chrome';
import path from 'path';
import { WebdriverConfigParams } from '../types';
describe('startDriver', () => {
  let config: WebdriverConfigParams;
  let browser: string;
  let driver: WebDriver;
  beforeEach(() => {
    browser = 'chrome-headless';
    config = {
      get browser() {
        return browser;
      }
    };
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('creates a driver', async () => {
    driver = await startDriver(config);
    assert.isObject(driver);
    assert.isFunction(driver.manage);
  });

  xit('sets the config.browser as the browser', async () => {
    browser = 'chrome';
    driver = await startDriver(config);
    const capabilities = await driver.getCapabilities();
    assert.equal(capabilities.get('browserName'), browser);
  });

  it('sets the browser as chrome with chrome-headless', async () => {
    browser = 'chrome-headless';
    driver = await startDriver(config);
    const capabilities = await driver.getCapabilities();

    assert.equal(capabilities.get('browserName'), 'chrome');
  });

  it('uses the chromedriver path with chrome-headless', async () => {
    browser = 'chrome-headless';
    driver = await startDriver(config);
    const chromedriverPath = (config as any).builder.chromeService_.exe_;

    assert.equal(chromedriverPath, chromedriver.path);
  });

  it('uses the passed in chromedriver path with chrome-headless', async () => {
    browser = 'chrome-headless';
    config.chromedriverPath = path.relative(process.cwd(), chromedriver.path);
    driver = await startDriver(config);
    const chromedriverPath = (config as any).builder.chromeService_.exe_;

    assert.notEqual(config.chromedriverPath, chromedriver.path);
    assert.equal(chromedriverPath, config.chromedriverPath);
  });

  it('passes the --no-sandbox argument to chromeOptions', async () => {
    browser = 'chrome-headless';
    config.chromeOptions = ['--no-sandbox'];
    driver = await startDriver(config);

    const options = config?.builder?.getChromeOptions();
    assert.isArray(options?.get('goog:chromeOptions').args);
    assert.deepEqual(options?.get('goog:chromeOptions').args, [
      'headless',
      '--no-sandbox'
    ]);
  });

  it('passes multiple arguments argument to chromeOptions', async () => {
    browser = 'chrome-headless';
    config.chromeOptions = ['no-sandbox', 'disable-dev-shm-usage'];
    driver = await startDriver(config);

    const options = config?.builder?.getChromeOptions();
    assert.isArray(options?.get('goog:chromeOptions').args);
    assert.deepEqual(options?.get('goog:chromeOptions').args, [
      'headless',
      'no-sandbox',
      'disable-dev-shm-usage'
    ]);
  });

  it('sets the --timeout flag', async () => {
    browser = 'chrome-headless';
    config.timeout = 10000;
    driver = await startDriver(config);
    config.builder;
    const timeoutValue = await driver.manage().getTimeouts();

    assert.isObject(timeoutValue);
    assert.deepEqual(timeoutValue.script, 10000000);
  });
});
