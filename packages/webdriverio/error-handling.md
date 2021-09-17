# Error Handling

## Table of Content

1. [Having an Out-of-date Driver](#having-an-out-of-date-driver)
2. [Having Popup blockers enabled](#having-popup-blockers-enabled)
3. [AxeBuilder.setLegacyMode(legacy: boolean)](#axebuildersetlegacymodelegacy-boolean)

Version 4.3.0 and above of the axe-core integrations use a new technique when calling `AxeBuilder.analyze()` which opens a new window at the end of a run. Many of the issues outlined in this document address common problems with this technique and their potential solutions.

### Having an Out-of-date Driver

A common problem is having an out-of-date driver. To fix this issue make sure that your local install of [geckodriver](https://github.com/mozilla/geckodriver/releases) or [chromedriver](https://chromedriver.chromium.org/downloads) is up-to-date.

An example error message for this problem will include a message about `switchToWindow`.

Example:

```console
(node:17566) UnhandledPromiseRejectionWarning: Error: Malformed type for "handle" parameter of command switchToWindow
Expected: string
Actual: undefined
```

### Having Popup blockers enabled

Popup blockers prevent us from opening the new window when calling `AxeBuilder.analyze()`. The default configuration for most automation testing libraries should allow popups. Please make sure that you do not explicitly enable popup blockers which may cause an issue while running the tests.

### AxeBuilder.setLegacyMode(legacy: boolean)

If for some reason you are unable to run the new `AxeBuilder.analyze` technique without errors, axe provides a new chainable method that allows you to run the legacy version of `AxeBuilder.analyze`. When using this method axe excludes accessibility issues that may occur in cross-domain frames and iframes.

**Please Note:** `AxeBuilder.setLegacyMode` is deprecated and will be removed in v5.0. Please report any errors you may have while running `AxeBuilder.analyze` so that they can be fixed before the legacy version is removed.

#### Example:

```js
const AxeBuilder = require('@axe-core/webdriverio').default;
const { remote } = require('webdriverio');

(async () => {
  const client = await remote({
    logLevel: 'error',
    capabilities: {
      browserName: 'chrome'
    }
  });

  await client.url('https://dequeuniversity.com/demo/mars/');

  const builder = new AxeBuilder({ client });
  try {
    const results = await builder
      // enables legacy mode
      .setLegacyMode()
      .analyze();
    console.log(results);
  } catch (e) {
    // do something with the error
  }
  await client.deleteSession();
})();
```
