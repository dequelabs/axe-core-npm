// in order to properly set global placeholders for `window` and `document` we have to
// import a file that does that.
// Setting them in this file will not work.
import _ from './setupGlobals.mjs';
import defaultExport from './dist/index.mjs';
import assert from 'assert';

const exportIsFunction = typeof defaultExport === 'function';
assert(exportIsFunction, 'export is not a function');
