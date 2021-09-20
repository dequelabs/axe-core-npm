import * as path from 'path';
import express from 'express';
import { createServer, Server } from 'http';
import testListen from 'test-listen';
import { expect } from 'chai';

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
