import defaultExport from '../dist/index.mjs';
import { AxeBuilder } from '../dist/index.mjs';
import assert from 'assert';
import * as webdriverio from 'webdriverio';
import { pathToFileURL } from 'url';
import { join } from 'path';
import { fixturesPath } from 'axe-test-fixtures';
import { spawn } from 'child_process';
import net from 'net';
import os from 'os';
import { readFileSync } from 'fs';

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxeBuilder === 'function', 'named export is not a function');
assert(
  defaultExport === AxeBuilder,
  'default and named export are not the same'
);

// Load browser-driver-manager env vars (same approach as axe-webdriverio.spec.ts)
const BDM_ENV_PATH = join(os.homedir(), '.browser-driver-manager', '.env');
try {
  const envContent = readFileSync(BDM_ENV_PATH, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=\s]+)=(.*)$/);
    if (match) {
      // Strip surrounding quotes that some .env writers add
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      process.env[match[1]] = value;
    }
  }
} catch {
  // .env file not found; env vars may already be set in the environment
}

const getFreePort = () => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
};

const connectToChromeDriver = port => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Unable to connect to ChromeDriver'));
    }, 1000);
    const socket = net.createConnection({ host: 'localhost', port }, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve();
    });
    socket.once('error', err => {
      clearTimeout(timer);
      socket.destroy();
      reject(err);
    });
  });
};

const getFreePort = () => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve(port);
        }
      });
    });
    server.once('error', reject);
  });
};

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
