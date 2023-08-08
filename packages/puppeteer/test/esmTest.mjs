import defaultExport, { AxePuppeteer } from '../dist/index.mjs';
import assert from 'assert';
import puppeteer from 'puppeteer';
import { fileURLToPath, pathToFileURL } from 'url';
import { join } from 'path';

const exportIsFunction = typeof defaultExport === 'function';
const exportIsSame = defaultExport === AxePuppeteer;
assert(exportIsFunction, 'export is not a function');
assert(exportIsSame, 'default and named export is not the same');

const options = {};

if (process.env.CI) {
  options.args = [];
  options.args.push('--no-sandbox', '--disable-setuid-sandbox');
  options.executablePath = '/usr/bin/google-chrome-stable';
}

async function integrationTest() {
  let path = fileURLToPath(new URL('.', import.meta.url));
  path = join(path, '../node_modules/axe-test-fixtures/fixtures/index.html');

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.goto(pathToFileURL(path));
  const results = await new AxePuppeteer(page).analyze();
  assert(results.violations.length > 0, 'could not find violations');
  await page.close();
  await browser.close();
}
integrationTest();
