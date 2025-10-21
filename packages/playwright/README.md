# @axe-core/playwright

> Provides a chainable axe API for playwright and automatically injects into all frames

This package does not follow Semantic Versioning (SemVer) but instead uses the major and minor version (but not patch version) of axe-core that the package uses. For example, if the API version is v4.7.2, then the axe-core version used by the package will be v4.7.x. The patch version of this package may include bug fixes and new API features but will not introduce breaking changes.

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already.

Install Playwright: `npm install playwright`

Install @axe-core/playwright: `npm install @axe-core/playwright`

## Usage

This module uses a chainable API to assist in injecting, configuring, and analyzing axe with [Playwright](https://playwright.dev/). As such, it is required to pass an instance of Playwright.

Here is an example of a script that will drive Playwright to a page, perform an analysis, and then log results to the console.

```js
const { AxeBuilder } = require('@axe-core/playwright');
const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
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

### AxeBuilder#include(selector: String | String[])

Adds a CSS selector to the list of elements to include in analysis

```js
new AxeBuilder({ page }).include('.results-panel');
```

Method chaining is also available, add multiple CSS selectors to the list of elements to include in analysis

```js
new AxeBuilder({ page })
  .include('.selector-one')
  .include('.selector-two')
  .include('.selector-three');
```

Note: arrays with more than one index when passing multiple CSS selectors are not currently supported example: ` .include(['#foo', '#bar', '#baz'])`

### AxeBuilder#exclude(selector: String | String[])

Add a CSS selector to the list of elements to exclude from analysis

```js
new AxeBuilder({ page }).exclude('.another-element');
```

Method chaining is also available, add multiple CSS selectors to the list of elements to exclude from analysis

```js
new AxeBuilder({ page })
  .exclude('.selector-one')
  .exclude('.selector-two')
  .exclude('.selector-three');
```

Note: arrays with more than one index when passing multiple CSS selectors are not currently supported example: ` .exclude(['#foo', '#bar', '#baz'])`

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

### AxeBuilder#setLegacyMode(legacyMode: boolean = true)

Set the frame testing method to "legacy mode". In this mode, axe will not open a blank page in which to aggregate its results. This can be used in an environment where opening a blank page is causes issues.

With legacy mode turned on, axe will fall back to its test solution prior to the 4.3 release, but with cross-origin frame testing disabled. The `frame-tested` rule will report which frames were untested.

**Important** Use of `.setLegacyMode()` is a last resort. If you find there is no other solution, please [report this as an issue](https://github.com/dequelabs/axe-core-npm/issues/).

```js
const axe = new AxeBuilder({ page }).setLegacyMode();
const result = await axe.analyze();
axe.setLegacyMode(false); // Disables legacy mode
```
