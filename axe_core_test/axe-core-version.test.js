const { assert } = require('chai');
const cli = require('../packages/cli/package.json');
const puppeteer = require('../packages/puppeteer/package.json');
const reporterEarl = require('../packages/reporter-earl/package.json');
const webdriverjs = require('../packages/webdriverjs/package.json');

describe('verify axe-core version', () => {
  const versioning = /([1-9].[0-9]*)/;

  it('cli', () => {
    const cliVersion = cli.version;
    const cliAxeCoreVersion = cli.dependencies['axe-core'];

    const [packageAxeCoreVersion] = cliAxeCoreVersion.match(versioning);
    const [axeCoreCliVersion] = cliVersion.match(versioning);
    assert.strictEqual(axeCoreCliVersion, packageAxeCoreVersion);
  });

  it('puppeteer', () => {
    const puppeteerVersion = puppeteer.version;
    const puppeteerAxeCoreVersion = puppeteer.dependencies['axe-core'];

    const [packageAxeCoreVersion] = puppeteerAxeCoreVersion.match(versioning);
    const [axeCorePuppeteerVersion] = puppeteerVersion.match(versioning);
    assert.strictEqual(axeCorePuppeteerVersion, packageAxeCoreVersion);
  });

  it('reporter-earl', () => {
    const reporterEarlVersion = reporterEarl.version;
    const reporterEarlAxeCoreVersion = reporterEarl.devDependencies['axe-core'];

    const [packageAxeCoreVersion] =
      reporterEarlAxeCoreVersion.match(versioning);
    const [axeCoreReporterEarlVersion] = reporterEarlVersion.match(versioning);
    assert.strictEqual(axeCoreReporterEarlVersion, packageAxeCoreVersion);
  });

  it('webdriverjs', () => {
    const webdriverjsVersion = webdriverjs.version;
    const webdriverjsAxeCoreVersion = webdriverjs.dependencies['axe-core'];

    const [packageAxeCoreVersion] = webdriverjsAxeCoreVersion.match(versioning);
    const [axeCoreWebdriverjsVersion] = webdriverjsVersion.match(versioning);

    assert.strictEqual(axeCoreWebdriverjsVersion, packageAxeCoreVersion);
  });
});
