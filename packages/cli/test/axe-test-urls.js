'use strict';

const assert = require('chai').assert;
const testPages = require('../lib/axe-test-urls');

describe('testPages', function () {
  let config, mockDriver;

  beforeEach(() => {
    mockDriver = {
      get: async arg => arg,
      executeAsyncScript: async arg => arg,
      executeScript: async arg => arg,
      wait: async arg => arg,
      switchTo: () => ({ defaultContent: () => {} }),
      findElements: async () => [],
      quit: async arg => arg
    };
    config = { driver: mockDriver };
  });

  it('return a promise', () => {
    assert.instanceOf(testPages([], config, {}), Promise);
  });

  it('calls driver.get() for each URL', async () => {
    const urlsCalled = [];
    const urls = ['http://foo', 'http://bar', 'http://baz'];

    mockDriver.get = async url => {
      urlsCalled.push(url);
      return url;
    };

    await testPages(urls, config, {});

    assert.deepEqual(urlsCalled, urls);
  });

  it('waits until the document is ready to have a className added', async () => {
    const asyncScripts = [];
    let waitCalls = 0;

    mockDriver.executeAsyncScript = async script => {
      asyncScripts.push(script);
      return script;
    };
    mockDriver.wait = async script => {
      waitCalls++;
      return script;
    };

    await testPages(['http://foo'], config, {});

    assert.equal(asyncScripts.length, 2);
    const [script] = asyncScripts;
    assert.match(
      script,
      /script\.innerHTML\s*=[\s\S]*['"]document\.documentElement\.classList\.add\(['"]deque-axe-is-ready/
    );

    assert.equal(waitCalls, 1);
  });

  it('injects axe into the page', async () => {
    const scripts = [];
    config.axeSource = 'axe="hi, I am axe"';
    mockDriver.executeScript = async script => {
      scripts.push(script);
      return script;
    };

    await testPages(['http://foo'], config, {});
    assert.include(scripts[0].toString(), config.axeSource);
  });

  it('runs axe once the page is loaded', async () => {
    const asyncScripts = [];
    mockDriver.executeAsyncScript = async script => {
      asyncScripts.push(script);
      return script;
    };

    await testPages(['http://foo'], config, {});

    assert.isDefined(
      asyncScripts
        .map(script => script.toString())
        .find(script => script.match(/(axe\.run)|(axe\.a11yCheck)/))
    );
  });
});
