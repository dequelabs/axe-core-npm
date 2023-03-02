# @axe-core/webdriverio

> Provides a chainable axe API for WebdriverIO and automatically injects into all frames.

## Feature Deprecation Notice

Support for `@wdio/sync` is deprecated and testing for it will be removed in a future release.

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already.

> Download and install any necessary browser drivers on your machine's PATH. [More on WebdriverIO setup](https://v6.webdriver.io/docs/gettingstarted.html#taking-the-first-step).

Install `@axe-core/webdriverio` and its dependencies:

NPM:

```console
npm install @axe-core/webdriverio
```

Yarn:

```console
yarn add @axe-core/webdriverio
```

## Usage

This module uses a chainable API to assist in injecting, configuring, and analyzing axe with WebdriverIO. As such, it is required to pass an instance of WebdriverIO.

Here is an example of a script that will drive WebdriverIO to a page, perform an analysis, and then log results to the console.

```js
const AxeBuilder = require('@axe-core/webdriverio').default;
const { remote } = require('webdriverio');

(async () => {
  const client = await remote({
    logLevel: 'error',
    capabilities: {
      browserName: 'firefox'
    }
  });

  await client.url('https://dequeuniversity.com/demo/mars/');

  const builder = new AxeBuilder({ client });
  try {
    const results = await builder.analyze();
    console.log(results);
  } catch (e) {
    console.error(e);
  }
})();
```

### AxeBuilder#analyze(): Promise<axe.Results | Error>

Performs analysis and passes any encountered error and/or the result object.

```js
new AxeBuilder({ client }).analyze((err, results) => {
  if (err) {
    // Do something with error
  }
  console.log(results);
});
```

```js
new AxeBuilder({ client })
  .analyze()
  .then(results => {
    console.log(results);
  })
  .catch(e => {
    // Do something with error
  });
```

## AxeBuilder({ client: WebdriverIO.BrowserObject })

Constructor for the AxeBuilder helper. You must pass an instance of WebdriverIO as the first argument.

```js
const builder = new AxeBuilder({ client });
```

### AxeBuilder#include(selector: String)

Adds a CSS selector to the list of elements to include in analysis

```js
new AxeBuilder({ client }).include('.results-panel');
```

### AxeBuilder#exclude(selector: String)

Add a CSS selector to the list of elements to exclude from analysis

```js
new AxeBuilder({ client }).exclude('.another-element');
```

### AxeBuilder#options(options: [axe.RunOptions](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter))

Specifies options to be used by `axe.run`. Will override any other configured options. including calls to `AxeBuilder#withRules()` and `AxeBuilder#withTags()`. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md) for information on its structure.

```js
new AxeBuilder({ client }).options({ checks: { 'valid-lang': ['orcish'] } });
```

### AxeBuilder#withRules(rules: String|Array)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single rule ID or an Array of multiple rule IDs. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.

```js
new AxeBuilder({ client }).withRules('html-lang');
```

```js
new AxeBuilder({ client }).withRules(['html-lang', 'image-alt']);
```

### AxeBuilder#withTags(tags: String|Array)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single tag or an Array of multiple tags. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.

```js
new AxeBuilder({ client }).withTags('wcag2a');
```

```js
new AxeBuilder({ client }).withTags(['wcag2a', 'wcag2aa']);
```

### AxeBuilder#disableRules(rules: String|Array)

Skips verification of the rules provided. Accepts a String of a single rule ID or an Array of multiple rule IDs. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#disableRules` will override specified options.

```js
new AxeBuilder({ client }).disableRules('color-contrast');
```

### AxeBuilder#setLegacyMode(legacyMode: boolean = true)

Set the frame testing method to "legacy mode". In this mode, axe will not open a blank page in which to aggregate its results. This can be used in an environment where opening a blank page is causes issues.

With legacy mode turned on, axe will fall back to its test solution prior to the 4.3 release, but with cross-origin frame testing disabled. The `frame-tested` rule will report which frames were untested.

**Important** Use of `.setLegacyMode()` is a last resort. If you find there is no other solution, please [report this as an issue](https://github.com/dequelabs/axe-core-npm/issues/).

```js
const axe = new AxeBuilder({ client }).setLegacyMode();
const result = await axe.analyze();
axe.setLegacyMode(false); // Disables legacy mode
```

### Shadow DOM support

`@axe-core/webdriverio` is unable to support iframes in shadow DOM elements due to lack of shadow DOM support in [webdriverio](https://webdriver.io/) devtools protocol.
