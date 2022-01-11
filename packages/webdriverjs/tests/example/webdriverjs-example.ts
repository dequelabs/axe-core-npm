import { assert } from 'chai';
import { Builder, WebDriver } from 'selenium-webdriver';
import AxeBuilder from '../../src';
import testListen = require('test-listen');
import { Server, createServer } from 'http';
import * as chrome from 'selenium-webdriver/chrome';
import * as express from 'express';
import * as path from 'path';

describe('@axe-core/webdriverjs example', () => {
  let driver: WebDriver;
  let server: Server;
  let addr: string;

  beforeEach(async () => {
    const app = express();
    app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
    server = createServer(app);
    addr = await testListen(server);

    driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless())
      .build();
  });

  afterEach(() => {
    driver.close();
    server.close();
  });

  it('should run analysis', async () => {
    await driver.get(`${addr}/context.html`);

    const results = await new AxeBuilder(driver).analyze();

    assert.isNotNull(results.inapplicable);
    assert.isNotNull(results.incomplete);
    assert.isNotNull(results.violations);
    assert.isNotNull(results.passes);
  });

  it('should find violations', async () => {
    await driver.get(`${addr}/context.html`);

    const results = await new AxeBuilder(driver).analyze();

    assert.isDefined(
      results.violations.find(rule => rule.id === 'frame-title')
    );
    assert.isDefined(results.violations.find(rule => rule.id === 'image-alt'));
    assert.isDefined(results.violations.find(rule => rule.id === 'region'));
  });

  it('should exclude CSS selector', async () => {
    await driver.get(`${addr}/context.html`);

    const results = await new AxeBuilder(driver).exclude('#ifr-one').analyze();

    assert.isUndefined(
      results.violations.find(rule => rule.id === 'frame-title')
    );
    assert.isUndefined(
      results.violations.find(rule => rule.id === 'image-alt')
    );
  });

  it('should include CSS selector', async () => {
    await driver.get(`${addr}/context.html`);

    const results = await new AxeBuilder(driver)
      .include('.include')
      .include('.include2')
      .analyze();

    assert.isEmpty(results.violations);
  });

  it('should disable rule', async () => {
    await driver.get(`${addr}/context.html`);

    const results = await new AxeBuilder(driver)
      .disableRules('image-alt')
      .analyze();

    assert.isUndefined(
      results.inapplicable.find(rule => rule.id === 'image-alt')
    );
    assert.isUndefined(
      results.incomplete.find(rule => rule.id === 'image-alt')
    );
    assert.isUndefined(
      results.violations.find(rule => rule.id === 'image-alt')
    );
    assert.isUndefined(results.passes.find(rule => rule.id === 'image-alt'));
  });
});
