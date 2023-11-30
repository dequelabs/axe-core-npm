// ensure backwards compatibility of commonJs format
const implicitDefaultExport = require('../dist/index.js'); // support <4.7.3
const explicitDefaultExport = require('../dist/index.js').default; // support 4.7.3+
const { AxePuppeteer } = require('../dist/index.js');
const assert = require('assert');

assert(typeof AxePuppeteer === 'function', 'named export is not a function');

assert(
  typeof implicitDefaultExport === 'function',
  'implicit default export is not a function'
);
assert(
  implicitDefaultExport === AxePuppeteer,
  'implicit default and named export are not the same'
);

assert(
  typeof explicitDefaultExport === 'function',
  'explicit default export is not a function'
);
assert(
  explicitDefaultExport === AxePuppeteer,
  'explicit default and named export are not the same'
);
