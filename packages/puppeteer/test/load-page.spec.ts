import 'mocha';
import { expect } from 'chai';
import { Server } from 'http';
import Puppeteer, { Browser } from 'puppeteer';
import * as sinon from 'sinon';
import { loadPage } from '../src/index';
import { puppeteerOpts, startServer } from './utils';

type SinonSpy = sinon.SinonSpy;

describe('loadPage', function () {
  let browser: Browser;
  let server: Server;
  let addr: string;

  this.timeout(10000);

  const fixtureFileURL = (filename: string): string => {
    return `${addr}/${filename}`;
  };

  before(async () => {
    ({ server, addr } = await startServer());
    const opts = puppeteerOpts();
    browser = await Puppeteer.launch(opts);
  });

  after(async () => {
    await browser.close();
    server.close();
  });

  it('handles creating a page for you', async function () {
    const url = fixtureFileURL('index.html');
    const page = await loadPage(browser, url);
    const results = await page.analyze();
    expect(results).to.exist;
  });

  it('closes the page for you', async function () {
    // Grab the original `newPage` method
    const newPage = browser.newPage.bind(browser);
    let pageCloseSpy: SinonSpy | undefined;

    // Stub `Browser::newPage`
    const newPageStub: sinon.SinonStub = sinon.stub(browser, 'newPage');
    // Stub Calls the original, but adds a spy to the returned `Page`'s `close` method
    newPageStub.callsFake(async () => {
      const page = await newPage.bind(browser)();
      pageCloseSpy = sinon.spy(page, 'close');
      return page;
    });

    try {
      const url = fixtureFileURL('index.html');
      const results = await (await loadPage(browser, url)).analyze();

      expect(results).to.exist;
      expect(pageCloseSpy).to.exist.and.have.property('called').that.is.true;
    } finally {
      // Make sure to restore `Browser::newPage`
      newPageStub.restore();
    }
  });
});
