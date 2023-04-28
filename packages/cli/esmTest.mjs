import { testPages } from './dist/index.mjs';
import assert from 'assert';

const exportIsFunction = typeof(testPages) === 'function';
assert(exportIsFunction, 'export is not a function');

