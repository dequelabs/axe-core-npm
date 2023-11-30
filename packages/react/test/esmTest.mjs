// ensure compatibility of ESM format

// in order to properly set global placeholders for `window` and `document` we have to
// import a file that does that.
// Setting them in this file will not work.
import './setupGlobals.mjs';
import defaultExport from '../dist/index.mjs';
import { logToConsole } from '../dist/index.mjs';
import assert from 'assert';

const exportIsFunction = typeof defaultExport === 'function';
assert(exportIsFunction, 'export is not a function');
assert(typeof logToConsole === 'function', 'logToConsole export is not a function');
