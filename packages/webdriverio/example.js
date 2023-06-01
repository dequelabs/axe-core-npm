const { AxeBuilder } = require('@axe-core/webdriverio');
const { remote } = require('webdriverio');

(async () => {
  const client = await remote({
    logLevel: 'error',
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['headless', 'disable-gpu']
      }
    }
  });
  await client.url('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder({ client }).analyze();
    console.log(results);
  } catch (e) {
    console.error(e);
  }

  client.deleteSession();
})();