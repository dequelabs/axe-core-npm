// This file isn't executed; we only care that typescript can successfully
// build/typecheck. It is a smoke test that our build process is producing a
// basically-reasonable index.d.ts.

// Detailed tests of individual types should instead be covered by unit tests.

import reactAxe from '../dist/index.js';
import React from 'react';
import ReactDOM from 'react-dom';

// See https://stackoverflow.com/a/55541672
type IsAny<T> = 0 extends 1 & T ? true : false;

// If the imports don't have typings assigned, these will fail
// with "ts(2322): Type 'false' is not assignable to type 'true'."
(x: IsAny<typeof reactAxe>): false => x;

reactAxe(React, ReactDOM, 1000);
