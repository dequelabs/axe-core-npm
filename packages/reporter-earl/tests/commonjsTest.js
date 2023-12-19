// ensure backwards compatibility of commonJs format
const implicitDefaultExport = require('../dist/axeReporterEarl.js');
const explicitDefaultExport = require('../dist/axeReporterEarl.js').default;
const assert = require('assert');

assert(
  typeof implicitDefaultExport === 'function',
  'implicit default export is not a function'
);

assert(
  typeof explicitDefaultExport === 'function',
  'explicit default export is not a function'
);
assert(
  explicitDefaultExport === implicitDefaultExport,
  'explicit default and named export are not the same'
);
