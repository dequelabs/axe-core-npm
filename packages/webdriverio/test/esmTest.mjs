import defaultExport from '../dist/index.mjs';
import { AxeBuilder } from '../dist/index.mjs';
import assert from 'assert';
import * as webdriverio from 'webdriverio';
import { fileURLToPath, pathToFileURL } from 'url';
import { join } from 'path';
import { fixturesPath } from 'axe-test-fixtures';

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxeBuilder === 'function', 'named export is not a function')
assert(defaultExport === AxeBuilder, 'default and named export are not the same');

async function integrationTest() {
  const path = join(fixturesPath, 'index.html');

  const options = {
    automationProtocol: 'devtools',
    path: '/',
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--headless']
      }
    },
    logLevel: 'error'
  };
  const client = await webdriverio.remote(options);
  await client.url(pathToFileURL(path).toString());

  const results = await new defaultExport({ client }).analyze();
  assert(results.violations.length > 0, 'could not find violations');
  process.exit(0);
}
integrationTest();
