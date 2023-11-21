// ensure backwards compatibility of commonJs format
global.window = {};
global.document = {};

const defaultExport = require('../dist/index.js');
const assert = require('assert');

assert(typeof defaultExport === 'function', 'export is not a function');
