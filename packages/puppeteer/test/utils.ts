import express from 'express';
import { createServer, Server } from 'http';
import listen from 'async-listen';
import { expect } from 'chai';
import type { PuppeteerLaunchOptions } from 'puppeteer';
import { fixturesPath } from 'axe-test-fixtures';
import path from 'path';
import os from 'os';
import { config } from 'dotenv';
const HOME_DIR = os.homedir();
const BDM_CACHE_DIR = path.resolve(HOME_DIR, '.browser-driver-manager');

config({ path: path.resolve(BDM_CACHE_DIR, '.env') });

export async function expectAsync(
  fn: () => Promise<any>
): Promise<Chai.Assertion> {
  try {
    const res = await fn();
    return expect(() => res);
  } catch (err) {
    return expect(() => {
      throw err;
    });
  }
}

export async function expectAsyncToNotThrow(
  fn: () => Promise<any>
): Promise<void> {
  const expectResult = await expectAsync(fn);
  expectResult.to.not.throw;
}

export async function startServer(): Promise<{ server: Server; addr: string }> {
  const app: express.Application = express();
  app.use(express.static(fixturesPath));
  const server: Server = createServer(app);
  // async-listen adds trailing forward slash,
  // this removes the unnecessary trailing forward slash
  const addr = (await listen(server)).toString().replace(/\/$/, '');

  return { server, addr };
}

export function puppeteerOpts(): PuppeteerLaunchOptions {
  const options: PuppeteerLaunchOptions = {};

  if (process.env.CI) {
    options.args = [];
    options.args.push('--no-sandbox', '--disable-setuid-sandbox');
    options.executablePath = process.env.CHROME_TEST_PATH;
  }

  return options;
}
