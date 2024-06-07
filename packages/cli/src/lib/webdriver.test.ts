import 'mocha';
import { assert } from 'chai';
import { startDriver } from './webdriver';
import { WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { config } from 'dotenv';
import os from 'os';
import path from 'path';
import { WebdriverConfigParams } from '../types';
import sinon from 'sinon';

const HOME_DIR = os.homedir();
const BDM_CACHE_DIR = path.resolve(HOME_DIR, '.browser-driver-manager');

config({ path: path.resolve(BDM_CACHE_DIR, '.env') });

const { CHROMEDRIVER_TEST_PATH } = process.env;

describe('startDriver', () => {
  let config: WebdriverConfigParams;
  let browser: string;
  let driver: WebDriver;
  beforeEach(() => {
    browser = 'chrome-headless';
    config = {
      timeout: 90,
      get browser() {
        return browser;
      }
    };
  });

  afterEach(async () => {
    // try catch required due to `chrome.options` being mocked with sinon
    // and not properly creating a driver
    try {
      await driver.quit();
    } catch (error) {}
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
    // https://github.com/seleniumbase/SeleniumBase/issues/2343\
    assert.include(capabilities.get('browserName'), 'chrome');
  });

  it('uses the chromedriver path with chrome-headless', async () => {
    browser = 'chrome-headless';
    driver = await startDriver(config);
    const chromedriverPath = (config as any).builder.chromeService_.exe_;

    assert.equal(chromedriverPath, CHROMEDRIVER_TEST_PATH);
  });

  it('uses the passed in chromedriver path with chrome-headless', async () => {
    browser = 'chrome-headless';
    config.chromedriverPath = path.relative(
      process.cwd(),
      CHROMEDRIVER_TEST_PATH as string
    );
    driver = await startDriver(config);
    const chromedriverPath = (config as any).builder.chromeService_.exe_;

    assert.notEqual(config.chromedriverPath, CHROMEDRIVER_TEST_PATH);
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

  it('invokes `options.headless()` on versions of selenium-webdriver < 4.17.0', async () => {
    const stub = sinon.stub(chrome, 'Options').returns({
      headless: () => {}
    });

    // try catch required due to `chrome.options` being mocked with sinon
    // and not properly creating a driver
    try {
      driver = await startDriver(config);
    } catch (error) {}
    assert.isTrue(stub.calledOnce);
    stub.restore();
  });
});
