import { browser } from '@wdio/globals';
import AxeBuilder from '@axe-core/webdriverio';
import { assert } from 'chai';
import express from 'express';
import { fixturesPath } from 'axe-test-fixtures';
import { Server, createServer } from 'http';
import testListen from 'test-listen';

describe('@wdio/globals', () => {
  let server: Server;
  let addr: string;
  let builder: AxeBuilder;
  before(async () => {
    const app = express();
    app.use(express.static(fixturesPath));
    server = createServer(app);
    addr = await testListen(server);
  });

  beforeEach(() => {
    // node v20 causes a typescript error due to our current type of WebdriverIO.Browser not being compatible with Browser from webriverio
    // @see https://github.com/dequelabs/axe-core-npm/issues/883
    builder = new AxeBuilder({ client: browser as any });
  });

  after(async () => {
    server.close();
  });

  it('should analyze the page', async () => {
    await browser.url(`${addr}/index.html`);
    const title = await browser.getTitle();
    const result = await builder.analyze();

    assert.notEqual(title, 'Error');
    assert.isDefined(result);
    assert.isArray(result.violations);
  });
});
