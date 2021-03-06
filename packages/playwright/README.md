# @axe-core/playwright

> Provides a chainable axe API for playwright and automatically injects into all frames

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already.

Install Playwright:

NPM:

```console
npm install playwright
```

Yarn:

```console
yarn add playwright
```

Install `@axe-core/playwright` and its dependencies:

NPM:

```console
npm install @axe-core/playwright
```

Yarn:

```console
yarn add @axe-core/playwright
```

## Usage

This module uses a chainable API to assist in injecting, configuring, and analyzing axe with [Playwright](https://playwright.dev/). As such, it is required to pass an instance of Playwright.

Here is an example of a script that will drive Playwright to a page, perform an analysis, and then log results to the console.

```js
const AxeBuilder = require('@axe-core/playwright').default;
const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder({ page }).analyze();
    console.log(results);
  } catch (e) {
    // do something with the error
  }
  await browser.close();
})();
```

## AxeBuilder({ page: Playwright.Page })

Constructor for the AxeBuilder helper. You must pass an instance of Playwright as the first argument.

```js
const builder = new AxeBuilder({ page });
```

### AxeBuilder#include(selector: String)

Adds a CSS selector to the list of elements to include in analysis

```js
new AxeBuilder({ page }).include('.results-panel');
```

### AxeBuilder#exclude(selector: String)

Add a CSS selector to the list of elements to exclude from analysis

```js
new AxeBuilder({ page }).exclude('.another-element');
```

### AxeBuilder#options(options: [axe.RunOptions](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter))

Specifies options to be used by `axe.run`. Will override any other configured options. including calls to `AxeBuilder#withRules()` and `AxeBuilder#withTags()`. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md) for information on its structure.

```js
new AxeBuilder({ page }).options({ checks: { 'valid-lang': ['orcish'] } });
```

### AxeBuilder#withRules(rules: String|Array)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single rule ID or an Array of multiple rule IDs. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.

```js
new AxeBuilder({ page }).withRules('html-lang');
```

```js
new AxeBuilder({ page }).withRules(['html-lang', 'image-alt']);
```

### AxeBuilder#withTags(tags: String|Array)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single tag or an Array of multiple tags. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.

```js
new AxeBuilder({ page }).withTags('wcag2a');
```

```js
new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
```

### AxeBuilder#disableRules(rules: String|Array)

Skips verification of the rules provided. Accepts a String of a single rule ID or an Array of multiple rule IDs. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#disableRules` will override specified options.

```js
new AxeBuilder({ page }).disableRules('color-contrast');
```

### AxeBuilder#analyze(): Promise<axe.Results | Error>

Performs analysis and passes any encountered error and/or the result object.

```js
new AxeBuilder({ page })
  .analyze()
  .then(results => {
    console.log(results);
  })
  .catch(e => {
    // Do something with error
  });
```
