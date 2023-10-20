import defaultExport from '../dist/index.mjs';
import assert from 'assert';
import * as webdriverio from 'webdriverio';
import { fileURLToPath, pathToFileURL } from 'url';
import { join } from 'path';
import { fixturesPath } from 'axe-test-fixtures';

const exportIsFunction = typeof defaultExport === 'function';
assert(exportIsFunction, 'export is not a function');

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
