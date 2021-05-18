// Adapter from axe-webdriverjs.
// This test tests to make sure that a valid configuration works.

import { expect } from 'chai';
import Puppeteer from 'puppeteer';
import * as path from 'path';
import AxePuppeteer from '../../src/index';
import Axe from 'axe-core';
import { customConfig, fixtureFilePath } from '../utils';
import express from 'express';
import { createServer } from 'http';
import testListen from 'test-listen';

describe('doc-dylang.html', function () {
  before(async function () {
    this.timeout(10000);

    const args = [];
    if (process.env.CI) {
      args.push('--no-sandbox', '--disable-setuid-sandbox');
    }
    this.browser = await Puppeteer.launch({ args });
  });
  after(async function () {
    await this.browser.close();
  });
  before(async function () {
    // const app: express.Application = express()
    const app: express.Application = express();
    app.use(express.static(path.resolve(__dirname, '..', 'fixtures')));
    this.server = createServer(app);
    this.addr = await testListen(this.server);

    this.fixtureFileURL = (filename: string): string => {
      return `${this.addr}/${filename}`;
    };
  });
  after(function () {
    this.server.close();
  });
  beforeEach(async function () {
    this.page = await this.browser.newPage();
  });
  afterEach(async function () {
    await this.page.close();
  });

  it('should find violations with customized helpUrl', async function () {
    const config = await customConfig();

    await this.page.goto(this.fixtureFileURL('doc-dylang.html'));

    const results = await new AxePuppeteer(this.page)
      .configure(config)
      .withRules(['dylang'])
      .analyze();

    expect(results.violations).to.have.lengthOf(1);
    expect(results.violations[0].id).to.eql('dylang');
    expect(
      results.violations[0].helpUrl.indexOf('application=axe-puppeteer')
    ).to.not.eql(-1);
    expect(results.passes).to.have.lengthOf(0);
  });

  it('configures in nested frames', async function () {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'));

    const results = await new AxePuppeteer(this.page)
      .configure(await customConfig())
      .withRules(['dylang'])
      .analyze();

    expect(results.violations.find((r: Axe.Result) => r.id === 'dylang')).to.not
      .be.undefined;
    expect(results.violations.find((r: Axe.Result) => r.id === 'dylang'))
      .to.have.property('nodes')
      .and.to.have.lengthOf(4);
  });

  it('omits results from iframes forbidden by allowedOrigins', async function () {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'));

    const config = await customConfig();
    config.allowedOrigins = ['http://not-our-iframe.example.com'];

    const results = await new AxePuppeteer(this.page)
      .configure(config)
      .withRules(['dylang'])
      .analyze();

    expect(results.violations.find((r: Axe.Result) => r.id === 'dylang')).to.not
      .be.undefined;
    expect(results.violations.find((r: Axe.Result) => r.id === 'dylang'))
      .to.have.property('nodes')
      .and.to.have.lengthOf(1); // omitting the 3 in disallowed iframe origins
  });
});
