# @axe-core/webdriverjs

Provides a chainable axe API for Selenium's WebDriverJS and automatically injects into all frames.

Previous versions of this program were maintained at [dequelabs/axe-webdriverjs](https://github.com/dequelabs/axe-webdriverjs).

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already. For running axe-webdriverjs tests read more about [setting up your environment](CONTRIBUTING.md).

> Download and install any necessary browser drivers on your machine's PATH. [More on Webdriver setup](https://seleniumhq.github.io/docs/wd.html).

Install Selenium Webdriver: `npm install selenium-webdriver --no-save`

Install @axe-core/webdriverjs and its dependencies: `npm install @axe-core/webdriverjs`

## Usage

This module uses a chainable API to assist in injecting, configuring and analyzing using aXe with Selenium WebDriverJS. As such, it is required to pass an instance of WebDriver.

Here is an example of a script that will drive Selenium to this repository, perform analysis and then log results to the console.

```javascript
var AxeBuilder = require('@axe-core/webdriverjs');
var WebDriver = require('selenium-webdriver');

var driver = new WebDriver.Builder()
  .forBrowser('firefox')
  .build();

driver
  .get('https://dequeuniversity.com/demo/mars/')
  .then(function() {
    AxeBuilder(driver).analyze(function(err, results) {
      if (err) {
        // Handle error somehow
      }
      console.log(results);
    });
  });
```

### AxeBuilder(driver:WebDriver[, axeSource:string])

Constructor for the AxeBuilder helper. You must pass an instance of selenium-webdriver as the first and only argument. Can be called with or without the `new` keyword.

```javascript
var builder = AxeBuilder(driver);
```

If you wish to run a specific version of axe-core, you can pass the source axe-core source file in as a string. Doing so will mean axe-webdriverjs runs this version of axe-core, instead of the one installed as a dependency of axe-webdriverjs.

```javascript
var axeSource = fs.readFileSync('./axe-1.0.js', 'utf8');
var builder = AxeBuilder(driver, axeSource);
```

### AxeBuilder#include(selector:String)

Adds a CSS selector to the list of elements to include in analysis

```javascript
AxeBuilder(driver)
  .include('.results-panel');
```

### AxeBuilder#exclude(selector:String)

Add a CSS selector to the list of elements to exclude from analysis

```javascript
AxeBuilder(driver)
  .include('.results-panel')
  .exclude('.results-panel h2');
```

### AxeBuilder#options(options:Object)

Specifies options to be used by `axe.a11yCheck`. **Will override any other configured options, including calls to `withRules` and `withTags`.** See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md) for information on its structure.

```javascript
AxeBuilder(driver)
  .options({ checks: { 'valid-lang': ['orcish'] } });
```

### AxeBuilder#withRules(rules:Mixed)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single rule ID or an Array of multiple rule IDs. **Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.**

```javascript
AxeBuilder(driver)
  .withRules('html-lang');
```

```javascript
AxeBuilder(driver)
  .withRules(['html-lang', 'image-alt']);
```

### AxeBuilder#withTags(tags:Mixed)

Limits analysis to only those with the specified rule IDs. Accepts a String of a single tag or an Array of multiple tags. **Subsequent calls to `AxeBuilder#options`, `AxeBuilder#withRules` or `AxeBuilder#withRules` will override specified options.**

```javascript
AxeBuilder(driver)
  .withTags('wcag2a');
```

```javascript
AxeBuilder(driver)
  .withTags(['wcag2a', 'wcag2aa']);
```

### AxeBuilder#disableRules(rules:Mixed)

Skips verification of the rules provided. Accepts a String of a single rule ID or an Array of multiple rule IDs. **Subsequent calls to `AxeBuilder#options`, `AxeBuilder#disableRules` will override specified options.**

```javascript
AxeBuilder(driver)
  .disableRules('color-contrast');
```

or use it combined with some specified tags:

```javascript
AxeBuilder(driver)
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules('color-contrast');
```

### AxeBuilder#configure(config:Object)

Inject an aXe configuration object to modify the ruleset before running Analyze. Subsequent calls to this
method will invalidate previous ones by calling `axe.configure` and replacing the config object. See
[axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure)
for documentation on the object structure.

```javascript
var config = {
  checks: [Object],
  rules: [Object]
};
AxeBuilder(driver)
  .configure(config)
  .analyze(function(err, results) {
    if (err) {
      // Handle error somehow
    }
    console.log(results);
  });
```

### AxeBuilder#analyze(callback:Function)

Performs analysis and passes any encountered error and/or the result object to the provided callback function or promise function. **Does not chain as the operation is asynchronous**

```javascript
AxeBuilder(driver)
  .analyze(function(err, results) {
    if (err) {
      // Handle error somehow
    }
    console.log(results);
  });
```

Using the returned promise (optional):

```javascript
AxeBuilder(driver)
  .analyze()
  .then(function(results) {
    console.log(results);
  })
  .catch(err => {
    // Handle error somehow
  });
```

_NOTE: to maintain backwards compatibility, the `analyze` function will also accept a callback which takes a single `results` argument. However, if an error is encountered during analysis, the error will be raised which will cause the **process to crash**. ⚠️ This functionality will be removed in the next major release.⚠️_

## Examples

This project has a couple integrations that demonstrate the ability and use of this module:

1. [Running a single rule](test/integration/doc-lang.js)
1. [Running against a page with frames](test/integration/frames.js)
1. [SauceLabs example](test/sauce/sauce.js)

## Contributing

Read the [documentation on contributing](CONTRIBUTING.md)
