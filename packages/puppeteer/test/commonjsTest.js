// ensure backwards compatibility of commonJs format
const defaultExport = require('../dist/index.js').default;
const { AxePuppeteer } = require('../dist/index.js');
const assert = require('assert');

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxePuppeteer === 'function', 'named export is not a function');
assert(
  defaultExport === AxePuppeteer,
  'default and named export are not the same'
);
