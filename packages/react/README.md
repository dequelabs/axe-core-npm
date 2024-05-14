# @axe-core/react

Test your React application with the [axe-core](https://github.com/dequelabs/axe-core) accessibility testing library. Results will show in the Chrome DevTools console.

Previous versions of this program were maintained at [dequelabs/react-axe](https://github.com/dequelabs/react-axe).

## React support

This package does not support React 18 and above. Deque released a product called [axe Developer Hub](https://www.deque.com/axe/developer-hub/). This product has [numerous JavaScript/TypeScript test framework integrations](https://docs.deque.com/developer-hub/2/en/dh-platform-support#browser-automation-platform-support) and is Deque's recommended path forward for users of this library who wish to use more modern versions of React.

The product has a free plan where each licensed user gets 1 API key. This is a good option for open-source projects or solo developers looking for high-quality accessibility feedback. [Sign up for the free plan](https://axe.deque.com/signup?product=axe-devtools-watcher&redirect_uri=https%3A%2F%2Faxe.deque.com%2Faxe-watcher%2Fstartup).

For more information, read the [blog post: Introducing axe Developer Hub, now available as part of axe DevTools for Web](https://www.deque.com/blog/introducing-axe-developer-hub-now-available-as-part-of-axe-devtools-for-web/)

## Usage

Install the module from NPM or elsewhere

```sh
npm install --save-dev @axe-core/react
```

## Initialize the module

Call the exported function passing in the React and ReactDOM objects as well as a timing delay in milliseconds that will be observed between each component change and the time the analysis starts.

```js
const React = require('react');
const ReactDOM = require('react-dom');

if (process.env.NODE_ENV !== 'production') {
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000);
}
```

Be sure to only run the module in your development environment (as shown in the code above) or else your application will use more resources than necessary when in production. You can use [envify](https://www.npmjs.com/package/envify) to do this as is shown in the [example](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/react/examples/shadow-dom/package.json#L37).

Once initialized, the module will output accessibility defect information to the Chrome Devtools console every time a component updates.

## Deduplicating

@axe-core/react will deduplicate violations using the rule that raised the violation and the CSS selector and the failureSummary of the specific node. This will ensure that each unique issue will only be printed to the console once. This can be disabled by setting `disableDeduplicate: true` in the configuration object as shown in the example [here](#configuration).

## Debouncing

The third argument to the exported function is the number of milliseconds to wait for component updates to cease before performing an analysis of all the changes. The changes will be batched and analyzed from the closest common ancestor of all the components that changed within the batch. This generally leads to the first analysis for a dynamic application, analyzing the entire page (which is what you want), while subsequent updates will only analyze a portion of the page (which is probably also what you want).

## Shadow DOM

With version 3.0.0, @axe-core/react now runs accessibility tests inside of open Shadow DOM. You don't have to do anything special other than run @axe-core/react on an component encapsulated with open Shadow DOM (as opposed to closed). For more information, see the [axe-core repo](https://github.com/dequelabs/axe-core).

## Configuration

There is a fourth optional argument that is a configuration object for axe-core. Read about the object here: https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure

```js
const config = {
  rules: [
    {
      id: 'skip-link',
      enabled: true
    }
  ],
  disableDeduplicate: true
};

axe(React, ReactDOM, 1000, config);
```

Axe-core's context object can be given as a fifth optional argument to specify which element should (and which should not) be tested. Read more from the Axe-core documentation: https://github.com/dequelabs/axe-core/blob/master/doc/API.md#context-parameter

```js
const context = {
  include: [['#preview']]
};

axe(React, ReactDOM, 1000, undefined, context);
```

## Run the example

Run a build in the example directory and start a server to see React-aXe in action in the Chrome Devtools console (opens on localhost:8888):

```sh
npm install
cd example
npm install
npm install -g http-server
npm start
```

## Run the tests

Install dependencies in the root directory (which also installs them in the example directory) and then run the tests:

```
npm install
npm test
```

To debug tests in the Cypress application:

```
npm run test:debug
```

## Compatibility

react-axe uses advanced console logging features and works best in the Chrome browser, with limited functionality in Safari and Firefox.
