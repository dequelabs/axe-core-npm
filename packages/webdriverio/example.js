const AxeBuilder = require('./dist/index').default;
const { remote } = require('webdriverio');

(async () => {
  const client = await remote({
    logLevel: 'error',
    capabilities: {
      browserName: 'chrome'
    }
  });

  await client.url('https://origprod-taos-frontend.pgmodernweb.com/');

  const builder = new AxeBuilder({ client });
  try {
    const { incomplete, violations } = await builder.analyze();
    console.log({ incomplete, violations });
  } catch (e) {
    console.error(e);
  } finally {
    client.deleteSession()
  }
})();