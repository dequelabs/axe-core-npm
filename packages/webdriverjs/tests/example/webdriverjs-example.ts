import { assert } from 'chai';
import { Builder, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import AxeBuilder from '@axe-core/webdriverjs';

describe('Deque Webdriverjs example', () => {
  let driver: WebDriver;

  beforeEach(() => {
    driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless())
      .build();
  });

  afterEach(() => {
    driver.close();
  });

  describe('Deqeue Homepage', () => {
    it('should run analysis', async () => {
      await driver.get('https://deque.com/');

      const results = await new AxeBuilder(driver).analyze();

      assert.isNotNull(results.inapplicable);
      assert.isNotNull(results.incomplete);
      assert.isNotNull(results.violations);
      assert.isNotNull(results.passes);
    });

    it('should find violations', async () => {
      await driver.get('https://deque.com/');

      const results = await new AxeBuilder(driver).analyze();

      assert.lengthOf(results.violations, 2);
      assert.equal(results.violations[0].id, 'landmark-no-duplicate-banner');
      assert.equal(results.violations[1].id, 'landmark-unique');
    });

    it('should exclude CSS selector', async () => {
      await driver.get('https://deque.com/');

      const results = await new AxeBuilder(driver)
        .exclude('#masthead')
        .analyze();

      assert.lengthOf(results.violations, 1);
      assert.equal(results.violations[0].id, 'landmark-no-duplicate-banner');
    });

    it('should include CSS selector', async () => {
      await driver.get('https://deque.com/');

      const results = await new AxeBuilder(driver)
        .include('#masthead')
        .analyze();

      assert.lengthOf(results.violations, 1);
      assert.equal(results.violations[0].id, 'landmark-no-duplicate-banner');
    });

    it('should disable rule', async () => {
      await driver.get('https://deque.com/');

      const results = await new AxeBuilder(driver)
        .disableRules('color-contrast')
        .analyze();

      assert.isEmpty(
        results.inapplicable.filter(rule => rule.id === 'color-contrast')
      );
      assert.isEmpty(
        results.incomplete.filter(rule => rule.id === 'color-contrast')
      );
      assert.isEmpty(
        results.violations.filter(rule => rule.id === 'color-contrast')
      );
      assert.isEmpty(
        results.passes.filter(rule => rule.id === 'color-contrast')
      );
    });
  });
});
