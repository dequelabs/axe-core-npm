// ensure backwards compatibility of commonJs format
const implicitDefaultExport = require('../dist/index.js');
const explicitDefaultExport = require('../dist/index.js').default;
const { AxeBuilder } = require('../dist/index.js');
const assert = require('assert');

assert(typeof AxeBuilder === 'function', 'named export is not a function');

assert(
  typeof implicitDefaultExport === 'function',
  'implicit default export is not a function'
);
assert(
  implicitDefaultExport === AxeBuilder,
  'implicit default and named export are not the same'
);

assert(
  typeof explicitDefaultExport === 'function',
  'explicit default export is not a function'
);
assert(
  explicitDefaultExport === AxeBuilder,
  'explicit default and named export are not the same'
);
