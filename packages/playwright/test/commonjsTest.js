// ensure backwards compatibility of commonJs format
const defaultExport = require('../dist/index.js').default;
const { AxeBuilder } = require('../dist/index.js');
const assert = require('assert');

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxeBuilder === 'function', 'named export is not a function');
assert(
  defaultExport === AxeBuilder,
  'default and named export are not the same'
);
