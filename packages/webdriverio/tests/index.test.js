const { describe, beforeEach, test, expect } = require('jest');
const bindings = require('../lib/bindings');

let browser = {};

beforeEach(() => {
  browser = {
    execute: () => {},
    executeAsync: () => {},
    frame: () => {},
    elements: () => {}
  };
});

describe('WebDriverIO Builder', () => {
  describe('Binding', () => {
    test('Should bind executeScript', async () => {
      expect(browser.executeScript).toBeUndefined();
      const boundBrowser = bindings(browser);
      expect(boundBrowser.executeScript).not.toBeUndefined();
    });
    test('Should bind executeAsyncScript', async () => {
      expect(browser.executeAsyncScript).toBeUndefined();
      const boundBrowser = bindings(browser);
      expect(boundBrowser.executeAsyncScript).not.toBeUndefined();
    });
    test('Should bind switchTo', async () => {
      expect(browser.switchTo).toBeUndefined();
      const boundBrowser = bindings(browser);
      expect(boundBrowser.switchTo).not.toBeUndefined();
    });
    test('Should bind findElements', async () => {
      expect(browser.findElements).toBeUndefined();
      const boundBrowser = bindings(browser);
      expect(boundBrowser.findElements).not.toBeUndefined();
    });
  });
});
