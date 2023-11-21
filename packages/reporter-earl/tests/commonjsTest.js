// ensure backwards compatibility of commonJs format
const defaultExport = require('../dist/axeReporterEarl.js').default;
const assert = require('assert');

const exportIsFunction = typeof defaultExport === 'function';
assert(exportIsFunction, 'export is not a function');
