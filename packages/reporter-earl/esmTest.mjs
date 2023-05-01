import defaultExport from './dist/axeReporterEarl.mjs';
import assert from 'assert';

const exportIsFunction = typeof(defaultExport) === 'function';
assert(exportIsFunction, 'export is not a function');
