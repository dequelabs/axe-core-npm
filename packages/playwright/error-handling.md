# Error Handling

## Table of Content

1. [Having Popup blockers enabled](#having-popup-blockers-enabled)
2. [AxeBuilder.setLegacyMode(legacy: boolean)](#axebuildersetlegacymodelegacy-boolean)

Version 4.3.0 and above of the axe-core integrations use a new technique when calling `AxeBuilder.analyze()` which opens a new window at the end of a run. Many of the issues outlined in this document address common problems with this technique and their potential solutions.

### Having Popup blockers enabled

Popup blockers prevent us from opening the new window when calling `AxeBuilder.analyze()`. The default configuration for most automation testing libraries should allow popups. Please make sure that you do not explicitly enable popup blockers which may cause an issue while running the tests.

### AxeBuilder.setLegacyMode(legacy: boolean)

If for some reason you are unable to run the new `AxeBuilder.analyze` technique without errors, axe provides a new chainable method that allows you to run the legacy version of `AxeBuilder.analyze`. When using this method axe excludes accessibility issues that may occur in cross-domain frames and iframes.

**Please Note:** `AxeBuilder.setLegacyMode` is deprecated and will be removed in v5.0. Please report any errors you may have while running `AxeBuilder.analyze` so that they can be fixed before the legacy version is removed.

#### Example:

```js
const AxeBuilder = require('@axe-core/playwright').default;
const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://dequeuniversity.com/demo/mars/');

  try {
    const results = await new AxeBuilder({ page })
      // enables legacy mode
      .setLegacyMode()
      .analyze();
    console.log(results);
  } catch (e) {
    // do something with the error
  }
  await browser.close();
})();
```
