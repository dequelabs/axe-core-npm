// ensure compatibility of ESM format
import defaultExport from '../dist/index.mjs';
import { AxeBuilder } from '../dist/index.mjs';
import assert from 'assert';

assert(typeof defaultExport === 'function', 'default export is not a function');
assert(typeof AxeBuilder === 'function', 'named export is not a function')
assert(defaultExport === AxeBuilder, 'default and named export are not the same');