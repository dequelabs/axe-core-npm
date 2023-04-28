import defaultExport, { AxePuppeteer } from './dist/index.mjs';
import assert from 'assert';

const exportIsFunction = typeof(defaultExport) === 'function';
const exportIsSame = defaultExport === AxePuppeteer;
assert(exportIsFunction, 'export is not a function');
assert(exportIsSame, 'default and named export is not the same');
