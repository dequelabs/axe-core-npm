import 'mocha';
import { assert } from 'chai';
import testPages from './axe-test-urls';

describe('testPages', function () {
  this.timeout(10000);
  let config: any;
  let mockDriver: any;

  beforeEach(() => {
    mockDriver = {
      get: async (arg: any) => arg,
      executeAsyncScript: async (arg: any) => arg,
      executeScript: async (arg: any) => arg,
      wait: async (arg: any) => arg,
      switchTo: () => ({ defaultContent: () => {} }),
      findElements: async () => [],
      quit: async (arg: any) => arg,
      manage: () => ({
        setTimeouts: async (arg: any) => arg
      })
    };
    config = { driver: mockDriver };
  });

  it('return a promise', () => {
    assert.instanceOf(testPages([], config, {} as any), Promise);
  });

  it('calls driver.get() for each URL', async () => {
    const urlsCalled: string[] = [];
    const urls = ['http://foo', 'http://bar', 'http://baz'];

    mockDriver.get = async (url: string) => {
      urlsCalled.push(url);
      return url;
    };

    await testPages(urls, config, {} as any);

    assert.deepEqual(urlsCalled, urls);
  });

  it('waits until the document is ready to have a className added', async () => {
    const asyncScripts: string[] = [];
    let waitCalls = 0;

    mockDriver.executeAsyncScript = async (script: string) => {
      asyncScripts.push(script);
      return script;
    };
    mockDriver.wait = async (script: string) => {
      waitCalls++;
      return script;
    };

    await testPages(['http://foo'], config, {} as any);

    assert.equal(asyncScripts.length, 2);
    const [script] = asyncScripts;
    assert.match(
      script,
      /script\.innerHTML\s*=[\s\S]*['"]document\.documentElement\.classList\.add\(['"]deque-axe-is-ready/
    );

    assert.equal(waitCalls, 1);
  });

  it('injects axe into the page', async () => {
    const scripts: string[] = [];
    config.axeSource = 'axe="hi, I am axe"';
    mockDriver.executeScript = async (script: string) => {
      scripts.push(script);
      return script;
    };

    await testPages(['http://foo'], config, {} as any);
    assert.include(scripts[0].toString(), config.axeSource);
  });

  it('runs axe once the page is loaded', async () => {
    const asyncScripts: string[] = [];
    mockDriver.executeAsyncScript = async (script: string) => {
      asyncScripts.push(script);
      return script;
    };

    await testPages(['http://foo'], config, {} as any);

    assert.isDefined(
      asyncScripts
        .map(script => script.toString())
        .find(script => script.match(/(axe\.run)|(axe\.a11yCheck)/))
    );
  });
});
