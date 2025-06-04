# @axe-core/webdriverjs

> Provides a chainable axe API for Selenium's WebDriverJS and automatically injects into all frames.

Previous versions of this program were maintained at [dequelabs/axe-webdriverjs](https://github.com/dequelabs/axe-webdriverjs).

This package does not follow Semantic Versioning (SemVer) but instead uses the major and minor version (but not patch version) of axe-core that the package uses. For example, if the API version is v4.7.2, then the axe-core version used by the package will be v4.7.x. The patch version of this package may include bug fixes and new API features but will not introduce breaking changes.

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already.

> Download and install any necessary browser drivers on your machine's PATH. [More on Webdriver setup](https://www.selenium.dev/documentation/en/webdriver/).

To install the latest version of Chromedriver globally, install browser-driver-manager: `npm install -g browser-driver-manager`. Then run `npx browser-driver-manager install chrome`.

Install Selenium Webdriver: `npm install selenium-webdriver`

Install @axe-core/webdriverjs: `npm install @axe-core/webdriverjs`

## Usage

This module uses a chainable API to assist in injecting, configuring, and analyzing axe with WebdriverJS. As such, it is required to pass an instance of WebdriverJS.

Here is an example of a script that will drive WebdriverJS to a page, perform an analysis, and then log results to the console.

```js
const { AxeBuilder } = require('@axe-core/webdriverjs');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async () => {
  const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().headless())
    .build();
  await driver.get('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder(driver).analyze();
    console.log(results);
  } catch (e) {
    // do something with the error
  }

  await driver.quit();
})();
```

## AxeBuilder(driver: Webdriver.WebDriver[, axeSource: string])

Constructor for the AxeBuilder helper. You must pass an instance of WebdriverJS as the first argument.

```js
const builder = new AxeBuilder(driver);
```

If you wish to run a specific version of [axe-core](https://github.com/dequelabs/axe-core), you can pass the source of axe-core source file in as a string. Doing so will mean `@axe-core/webdriverjs` run this version of axe-core, instead of the one installed as a dependency of `@axe-core/webdriverjs`.

```js
const axeSource = fs.readFileSync('./axe-1.0.js', 'utf-8');
const builder = new AxeBuilder(driver, axeSource);
```

### AxeBuilder#analyze(): Promise<axe.Results>

Performs analysis and passes any encountered error and/or the result object.

```js
new AxeBuilder(driver).analyze((err, results) => {
  if (err) {
    // Do something with error
  }
  console.log(results);
});
```

```js
new AxeBuilder(driver)
  .analyze()
  .then(results => {
    console.log(results);
  })
  .catch(e => {
    // Do something with error
  });
```

### AxeBuilder#include(selector: String)

Adds a CSS selector to the list of elements to include in analysis

```js
new AxeBuilder(driver).include('.results-panel');
```

### AxeBuilder#exclude(selector: String)

Add a CSS selector to the list of elements to exclude from analysis

```js
new AxeBuilder(driver).include('.some-element').exclude('.another-element');
```

### AxeBuilder#options(options: [axe.RunOptions](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter))

Specifies options to be used by `axe.run`. Will override any other configured options. including calls to `AxeBuilder#withRules()` and `AxeBuilder#withTags()`. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md) for information on its structure.

```js
new AxeBuilder(driver).options({ checks: { 'valid-lang': ['orcish'] } });
```

### AxeBuilder#withRules(rules: String|Array)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single rule ID or an Array of multiple rule IDs. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.

```js
new AxeBuilder(driver).withRules('html-lang');
```

```js
new AxeBuilder(driver).withRules(['html-lang', 'image-alt']);
```

### AxeBuilder#withTags(tags: String|Array)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single tag or an Array of multiple tags. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.

```js
new AxeBuilder(driver).withTags('wcag2a');
```

```js
new AxeBuilder(driver).withTags(['wcag2a', 'wcag2aa']);
```

### AxeBuilder#disableRules(rules: String|Array)

Skips verification of the rules provided. Accepts a String of a single rule ID or an Array of multiple rule IDs. Subsequent calls to `AxeBuilder#options`, `AxeBuilder#disableRules` will override specified options.

```js
new AxeBuilder(driver).disableRules('color-contrast');
```

### AxeBuilder#configure(config: [axe.Spec](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure))

Inject an axe configuration object to modify the ruleset before running Analyze. Subsequent calls to this method will invalidate previous ones by calling `axe.configure` and replacing the config object. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure) for documentation on the object structure.

```js
const config = {
  checks: axe.Check[],
  rules: axe.Rule[]
}

new AxeBuilder(driver).configure(config).analyze((err, results) => {
  if (err) {
    // Handle error somehow
  }
  console.log(results)
})
```

### AxeBuilder#setLegacyMode(legacyMode: boolean = true)

Set the frame testing method to "legacy mode". In this mode, axe will not open a blank page in which to aggregate its results. This can be used in an environment where opening a blank page is causes issues.

With legacy mode turned on, axe will fall back to its test solution prior to the 4.3 release, but with cross-origin frame testing disabled. The `frame-tested` rule will report which frames were untested.

**Important** Use of `.setLegacyMode()` is a last resort. If you find there is no other solution, please [report this as an issue](https://github.com/dequelabs/axe-core-npm/issues/).

```js
const axe = new AxeBuilder(driver).setLegacyMode();
const result = await axe.analyze();
axe.setLegacyMode(false); // Disables legacy mode
```

### WebdriverJS Example

We have created an example [test suite](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverjs/tests/examples/webdriverjs-example.ts) showcasing the functionality of axe-core WebdriverJS.

To run the test:

- Navigate to: `/webdriverjs/tests/example`
- Install node modules: `npm install`
- Run tests: `npm test`
