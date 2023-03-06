import * as path from 'path';
import express from 'express';
import { createServer, Server } from 'http';
import testListen from 'test-listen';
import { expect } from 'chai';
import { fileURLToPath } from 'url';
let dirname: string;
if (typeof __dirname === 'undefined') {
  // utilities for ESM to use __dirname
  const filename = fileURLToPath(import.meta.url);
  dirname = path.dirname(filename);
} else {
  dirname = __dirname;
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
  app.use(express.static(path.resolve(dirname, 'fixtures')));
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
