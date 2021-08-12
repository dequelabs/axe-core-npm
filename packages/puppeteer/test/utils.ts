import { Spec } from 'axe-core';
import * as fsOrig from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import express from 'express';
import { createServer, Server } from 'http';
import testListen from 'test-listen';
import { expect } from 'chai';

const fs = {
  readFile: promisify(fsOrig.readFile)
};

export function fixtureFilePath(filename: string): string {
  return path.resolve(__dirname, 'fixtures', filename);
}

export async function customConfig(): Promise<any> {
  const configFile = fixtureFilePath('custom-rule-config.json');
  const config = JSON.parse(await fs.readFile(configFile, 'utf8')) as Spec;
  return config;
}

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
  app.use(express.static(path.resolve(__dirname, 'fixtures')));
  const server: Server = createServer(app);
  const addr = await testListen(server);

  return { server, addr };
}

export function puppeteerArgs(): string[] {
  const args: string[] = [];
  if (process.env.CI) {
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }
  return args;
}
