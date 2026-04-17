import defaultExport from '../dist/index.mjs';
import { AxeBuilder } from '../dist/index.mjs';
import assert from 'assert';
import * as webdriverio from 'webdriverio';
import { pathToFileURL } from 'url';
import { join } from 'path';
import { fixturesPath } from 'axe-test-fixtures';
import { spawn } from 'child_process';
import { getFreePort, connectToChromeDriver } from './testUtils.js';

const { default: { path: chromedriverPath } } = await import('chromedriver');

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxeBuilder === 'function', 'named export is not a function');
assert(
  defaultExport === AxeBuilder,
  'default and named export are not the same'
);

async function integrationTest() {
  const port = await getFreePort();

  const chromedriverProcess = spawn(chromedriverPath, [
    `--port=${port}`
  ], { stdio: 'inherit' });

  await connectToChromeDriver(port);

  let client;
  try {
    const options = {
      path: '/',
      hostname: 'localhost',
      port,
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless', '--no-sandbox']
        }
      },
      logLevel: 'error'
    };

    client = await webdriverio.remote(options);
    await client.url(pathToFileURL(join(fixturesPath, 'index.html')).toString());

    const results = await new defaultExport({ client }).analyze();
    assert(results.violations.length > 0, 'could not find violations');
  } finally {
    await client?.deleteSession();
    chromedriverProcess.kill();
  }

  process.exit(0);
}

integrationTest();
