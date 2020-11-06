# Next.js Example using `@axe-core/react`

A simple example of a [Next.js](https://nextjs.org/) application using `@axe-core/react`.

This project was bootstrapped with [Create Next App](https://github.com/segmentio/create-next-app).

## How does it work?

To get Next.js and `@axe-core/react` working together, we simply create a `pages/_app.js` file which conditionally injects axe. We only run axe in development, and only if we're in a browser (not SSR).

The `_app.js` file looks something like:

```js
import React from 'react';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const ReactDOM = require('react-dom');
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000);
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
```
