import defaultExport from '../dist/index.mjs';
import assert from 'assert';

const exportIsFunction = typeof(defaultExport) === 'function';
assert(exportIsFunction, 'export is not a function');
