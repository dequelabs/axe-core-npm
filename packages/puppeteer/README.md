# @axe-core/puppeteer

Provides a chainable axe API for Puppeteer and automatically injects into all frames.

Previous versions of this program were maintained at [dequelabs/axe-puppeteer](https://github.com/dequelabs/axe-puppeteer).

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already.

Install Puppeteer: `npm install puppeteer --no-save`

Install axe-puppeteer and its dependencies: `npm install @axe-core/puppeteer`

## Usage

This module uses a chainable API to assist in injecting, configuring and analyzing using axe with Puppeteer. As such, it is required to pass an instance of a Puppeteer `Page` or `Frame`.

Here is an example of a script that will drive Puppeteer to this repository, perform analysis and then log results to the console.

```js
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setBypassCSP(true);

  await page.goto('https://dequeuniversity.com/demo/mars/');

  const results = await new AxePuppeteer(page).analyze();
  console.log(results);

  await page.close();
  await browser.close();
})();
```

Note: Usage examples make use of ES2017 async/await. Use of `await` can only be done in a function
declared `async`. If your project does not support async/await, you can just directly use the promise
`async` functions return. [Check here for more
information.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

## Bypassing Content Security Policy

When trying to run axe, you might run into issues if the page you are checking has Content Security Policy enabled. To get around this, you must disable it through `Page#setBypassCSP` **before** navigating to the site.

### loadPage(browser: Browser, url: string, { opts, source }: { opts?: any, source?: string } = {})

An alternate constructor is available which opens a page and performs the CSP bypass for you.

It closes the page after `analyze` is called.

```js
const { loadPage } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const axeBuilder = await loadPage(
    browser,
    'https://dequeuniversity.com/demo/mars/'
  );
  const results = await axeBuilder.analyze();
  console.log(results);

  await browser.close();
})();
```

### AxePuppeteer(page: Frame | Page[, axeSource: string])

Constructor for the AxePuppeteer helper.
You must pass an instance of a Puppeteer `Frame` or `Page` as the first argument. Cannot be called without the `new` keyword.

```js
const builder = new AxePuppeteer(page);
```

If you wish to run a specific version of axe-core, you can pass the source `axe-core` source file in as a string. Doing so will mean axe-puppeteer runs this version of axe-core, instead of the one installed as a dependency of axe-puppeteer.

```js
const axeSource = fs.readFileSync('./axe-3.0.js', 'utf8');
const builder = new AxePuppeteer(page, axeSource);
```

Note that you might need to bypass the Content Security Policy in some cases.

### AxePuppeteer#analyze([callback: (Error | null[, Object]) => void])

Performs analysis and passes any encountered error and/or the result object to the provided callback function or promise function. **Does not chain as the operation is asynchronous**

Using the returned promise (optional):

```js
new AxePuppeteer(page)
  .analyze()
  .then(function (results) {
    console.log(results);
  })
  .catch(err => {
    // Handle error somehow
  });
```

Using a callback function

```js
new AxePuppeteer(page).analyze(function (err, results) {
  if (err) {
    // Handle error somehow
  }
  console.log(results);
});
```

### AxePuppeteer#include(selector: string | string[])

Adds a CSS selector to the list of elements to include in analysis

```js
new AxePuppeteer(page).include('.results-panel');
```

### AxePuppeteer#exclude(selector: string | string[])

Add a CSS selector to the list of elements to exclude from analysis

```js
new AxePuppeteer(page).include('.results-panel').exclude('.results-panel h2');
```

### AxePuppeteer#options(options: Axe.RunOptions)

Specifies options to be used by `axe.run`. **Will override any other configured options, including calls to `withRules` and `withTags`.**
See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md)
for information on its structure.

```js
new AxePuppeteer(page).options({
  checks: { 'valid-lang': ['orcish'] }
});
```

### AxePuppeteer#withRules(rules: string | string[])

Limits analysis to only those with the specified rule IDs. Accepts a String of a single rule ID or an Array of multiple rule IDs. **Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#withRules` or `AxePuppeteer#withRules` will override specified options.**

```js
new AxePuppeteer(page).withRules('html-lang');
```

```js
new AxePuppeteer(page).withRules(['html-lang', 'image-alt']);
```

### AxePuppeteer#withTags(tags: string | string[])

Limits analysis to only those with the specified rule IDs. Accepts a String of a single tag or an Array of multiple tags. **Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#withRules` or `AxePuppeteer#withRules` will override specified options.**

```js
new AxePuppeteer(page).withTags('wcag2a');
```

```js
new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa']);
```

### AxePuppeteer#disableRules(rules: string | string[])

Skips verification of the rules provided. Accepts a String of a single rule ID or an Array of multiple rule IDs. **Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#disableRules` will override specified options.**

```js
new AxePuppeteer(page).disableRules('color-contrast');
```

or use it combined with some specified tags:

```js
new AxePuppeteer(page)
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules('color-contrast');
```

### AxePuppeteer#disableFrame(selector: string)

Skips specific frame with selector provided. Accepts a String of a single selector. **Subsequent calls to `AxePuppeteer#options`, `AxePuppeteer#disableFrame` will override specified options.**

```js
new AxePuppeteer(page).disableFrame('#my-frame');
```

or use it combined with some specified tags:

```js
new AxePuppeteer(page)
  .withTags(['wcag2a', 'wcag2aa'])
  .disableFrame('#my-frame');
```

### AxePuppeteer#configure(config: Axe.Spec)

Inject an axe configuration object to modify the ruleset before running Analyze. Subsequent calls to this method will invalidate previous ones by calling `axe.configure` and replacing the config object. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure) for documentation on the object structure.

```js
const config = {
  checks: [Object],
  rules: [Object]
};
const results = await new AxePuppeteer(page).configure(config).analyze();
console.log(results);
```

### AxePuppeteer#setLegacyMode(legacyMode: boolean = true)

Set the frame testing method to "legacy mode". In this mode, axe will not open a blank page in which to aggregate its results. This can be used in an environment where opening a blank page is causes issues.

With legacy mode turned on, axe will fall back to its test solution prior to the 4.3 release, but with cross-origin frame testing disabled. The `frame-tested` rule will report which frames were untested.

**Important** Use of `.setLegacyMode()` is a last resort. If you find there is no other solution, please [report this as an issue](https://github.com/dequelabs/axe-core-npm/issues/).

```js
const axe = new AxePuppeteer(page).setLegacyMode();
const result = await axe.analyze();
axe.setLegacyMode(false); // Disables legacy mode
```

## Caveat

Due to axe-core needing to be injected into the page and executed we are unable to do the following:

```js
await page.setJavaScriptEnabled(false);
```
