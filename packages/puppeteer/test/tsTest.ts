// This file isn't executed; we only care that typescript can successfully
// build/typecheck. It is a smoke test that our build process is producing a
// basically-reasonable index.d.ts.

// Detailed tests of individual types should instead be covered by unit tests.

import { AxePuppeteer as NamedImportAxeBuilder } from '../dist/index.js';
import DefaultImportAxeBuilder from '../dist/index.js';
import type { Page } from 'puppeteer';

// See https://stackoverflow.com/a/55541672
type IsAny<T> = 0 extends 1 & T ? true : false;

// If the imports don't have typings assigned, these will fail
// with "ts(2322): Type 'false' is not assignable to type 'true'."
(x: IsAny<typeof NamedImportAxeBuilder>): false => x;
(x: IsAny<typeof DefaultImportAxeBuilder>): false => x;

new NamedImportAxeBuilder({} as Page).withRules('label').analyze();

new DefaultImportAxeBuilder({} as Page).withRules('label').analyze();
