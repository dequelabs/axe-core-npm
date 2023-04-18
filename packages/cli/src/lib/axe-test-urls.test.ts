import 'mocha';
import { assert } from 'chai';
import testPages from './axe-test-urls';
import { ConfigParams } from '../types';

describe('testPages', function () {
  this.timeout(10000);
  let config: ConfigParams;
  let mockDriver: any;

  beforeEach(() => {
    const func = async (arg: any) => '{}';
    mockDriver = {
      get: func,
      executeAsyncScript: func,
      executeScript: func,
      wait: func,
      switchTo: () => ({ defaultContent: () => {} }),
      findElements: async () => [],
      quit: func,
      manage: () => ({
        setTimeouts: func
      })
    };
    config = { driver: mockDriver };
  });

  it('return a promise', () => {
    assert.instanceOf(testPages([], config), Promise);
  });

  it('calls driver.get() for each URL', async () => {
    const urlsCalled: string[] = [];
    const urls = ['http://foo', 'http://bar', 'http://baz'];

    mockDriver.get = async (url: string) => {
      urlsCalled.push(url);
      return url;
    };

    await testPages(urls, config);

    assert.deepEqual(urlsCalled, urls);
  });

  it('injects axe into the page', async () => {
    const scripts: string[] = [];
    config.axeSource = 'axe="hi, I am axe"';
    mockDriver.executeScript = async (script: string) => {
      scripts.push(script);
      return script;
    };

    await testPages(['http://foo'], config);
    assert.include(scripts[0].toString(), config.axeSource);
  });

  it('runs axe once the page is loaded', async () => {
    const asyncScripts: string[] = [];
    mockDriver.executeAsyncScript = async (script: string) => {
      asyncScripts.push(script);
      return '{}';
    };

    await testPages(['http://foo'], config);

    assert.isDefined(
      asyncScripts
        .map(script => script.toString())
        .find(script => script.match(/(axe\.run)|(axe\.a11yCheck)/))
    );
  });
});
