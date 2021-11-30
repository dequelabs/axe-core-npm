const { remote } = require('webdriverio');
const { default: AxeBuilder } = require('@axe-core/webdriverio');
const { version } = require('@axe-core/webdriverio/package.json');

describe(`@axe-core/webdriverio v${version}`, function () {
  let client;
  before(async () => {
    client = await remote({
      logLevel: 'error',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless']
        }
      }
    });
  });

  after(async () => {
    await client.deleteSession();
  });

  it('runs without errors', async () => {
    await client.url('https://dequeuniversity.com/demo/mars/');
    const builder = new AxeBuilder({ client });
    await builder.analyze();
  });
});
