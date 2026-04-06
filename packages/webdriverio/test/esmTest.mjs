import defaultExport from '../dist/index.mjs';
import { AxeBuilder } from '../dist/index.mjs';
import assert from 'assert';
import * as webdriverio from 'webdriverio';
import { pathToFileURL } from 'url';
import { join } from 'path';
import { fixturesPath } from 'axe-test-fixtures';
import { spawn } from 'child_process';
import { getFreePort, connectToChromeDriver, loadBdmEnv } from './testUtils.js';

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxeBuilder === 'function', 'named export is not a function');
assert(
  defaultExport === AxeBuilder,
  'default and named export are not the same'
);

loadBdmEnv();

async function integrationTest() {
  const port = await getFreePort();

  assert(
    process.env.CHROMEDRIVER_TEST_PATH,
    'CHROMEDRIVER_TEST_PATH is not set. Run `npx browser-driver-manager install chrome`'
  );
  assert(
    process.env.CHROME_TEST_PATH,
    'CHROME_TEST_PATH is not set. Run `npx browser-driver-manager install chrome`'
  );

  const chromedriverProcess = spawn(process.env.CHROMEDRIVER_TEST_PATH, [
    `--port=${port}`
  ], { stdio: 'inherit' });

  await new Promise(r => setTimeout(r, 500));
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
          args: ['--headless', '--no-sandbox'],
          binary: process.env.CHROME_TEST_PATH
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
