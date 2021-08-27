import path from 'path';
import fs from 'fs';
import { performance } from 'perf_hooks';
import Puppeteer from 'puppeteer';
import AxePuppeteer from '../src/index';
import { startServer, puppeteerArgs } from './utils';

const axeSource = fs.readFileSync(require.resolve('axe-core'), 'utf8');
const axeForceLegacyPath = path.resolve(
  __dirname,
  'fixtures/external/axe-force-legacy.js'
);
const axeForceLegacy = fs.readFileSync(axeForceLegacyPath, 'utf8');
const runs = 100;

(async () => {
  const { server, addr } = await startServer();
  const args = puppeteerArgs();
  const browser = await Puppeteer.launch({ args });
  const page = await browser.newPage();

  // AxePuppeteer normal:
  let total1 = 0;
  console.log('Performance test runPartial');
  for (let i = 0; i < runs; i++) {
    await page.goto(`${addr}/context.html`);
    const start = performance.now();
    await new AxePuppeteer(page, axeSource).analyze();
    total1 += performance.now() - start;
  }

  let total2 = 0;
  console.log('starting test run');
  for (let i = 0; i < runs; i++) {
    await page.goto(`${addr}/context.html`);
    const start = performance.now();
    await new AxePuppeteer(page, axeSource + axeForceLegacy).analyze();
    total2 += performance.now() - start;
  }

  console.log(
    `Avg of AxePuppeteer running with axe.runPartial(): ${total1 / runs}`
  );
  console.log(`Avg of AxePuppeteer running with axe.run(): ${total2 / runs}`);

  server.close();
  await browser.close();
})();
