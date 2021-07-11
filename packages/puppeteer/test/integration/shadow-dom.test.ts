// Adapter from axe-webdriverjs.
// This test tests to make sure that a valid configuration works.

import { expect } from 'chai';
import Puppeteer from 'puppeteer';
import * as path from 'path';
import AxePuppeteer from '../../src/index';
import express from 'express';
import { createServer } from 'http';
import testListen from 'test-listen';

describe('shadow-dom.html', function () {
  before(async function () {
    this.timeout(10000);
    const args = [];
    if (process.env.CI) {
      args.push('--no-sandbox', '--disable-setuid-sandbox');
    }
    this.browser = await Puppeteer.launch({ args });

    const app: express.Application = express();
    app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
    this.server = createServer(app);
    this.addr = await testListen(this.server);

    this.fixtureFileURL = (filename: string): string => {
      return `${this.addr}/${filename}`;
    };
  });

  after(async function () {
    await this.browser.close();
    this.server.close();
  });

  beforeEach(async function () {
    this.page = await this.browser.newPage();
  });

  afterEach(async function () {
    await this.page.close();
  });

  it('should find violations with customized helpUrl', async function () {
    await this.page.goto(this.fixtureFileURL('shadow-dom.html'));

    const results = await new AxePuppeteer(this.page)
      .withRules(['heading-order'])
      .analyze();

    expect(results.violations).to.have.lengthOf(0);
  });
});
