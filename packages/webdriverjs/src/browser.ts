import {
  AxeResults,
  ContextObject,
  FrameContext,
  RunOptions,
  Spec,
  PartialResult
} from 'axe-core';
import { WebDriver, WebElement } from 'selenium-webdriver';

export type FrameContextWeb = FrameContext & {
  frame: WebElement;
  href: string;
};

// https://github.com/vercel/pkg/issues/676
// we need to pass a string vs a function so we manually stringified the function

export function axeSourceInject(
  driver: WebDriver,
  axeSource: string,
  config: Spec | null
): Promise<void> {
  return promisify(
    driver.executeScript(`
      ${axeSource};
      (function () {
        window.axe.configure({
          branding: { application: 'webdriverjs' }
        });
        var config = ${JSON.stringify(config)};
        if (config) {
          window.axe.configure(config);
        }
      }());
    `)
  );
}

export function axeRunPartial(
  driver: WebDriver,
  context: ContextObject,
  options: RunOptions
): Promise<PartialResult> {
  return promisify(
    driver.executeAsyncScript<PartialResult>(`
      const callback = arguments[arguments.length - 1];
      const context = ${JSON.stringify(context)} || document;
      const options = ${JSON.stringify(options)} || {};
      window.axe.runPartial(context, options).then(callback);
    `)
  );
}

export function axeFinishRun(
  driver: WebDriver,
  partialResults: Array<PartialResult | null>,
  options: RunOptions
): Promise<AxeResults> {
  return promisify(
    driver.executeAsyncScript<AxeResults>(`
      var partialResults = ${JSON.stringify(partialResults)};
      var options = ${JSON.stringify(options || {})};
      var callback = arguments[arguments.length - 1];
      axe.finishRun(partialResults, options).then(callback);
    `)
  );
}

export function axeGetFrameContext(
  driver: WebDriver,
  context: ContextObject
): Promise<FrameContextWeb[]> {
  return promisify(
    driver.executeAsyncScript<FrameContextWeb[]>(`
      var context = ${JSON.stringify(context)}
      var callback = arguments[arguments.length - 1];
      var frameContexts = window.axe.utils.getFrameContexts(context);
      callback(frameContexts.map(function (frameContext) {
        return Object.assign(frameContext, {
          href: window.location.href, // For debugging
          frame: axe.utils.shadowSelect(frameContext.frameSelector)
        });
      }));
    `)
  );
}

export function axeSupportsRunPartial(driver: WebDriver): Promise<boolean> {
  return promisify(
    driver.executeScript<boolean>(`
      return typeof window.axe.runPartial === 'function'
    `)
  );
}

export function axeRunLegacy(
  driver: WebDriver,
  context: ContextObject,
  options: RunOptions,
  config: Spec | null
): Promise<AxeResults> {
  // https://github.com/vercel/pkg/issues/676
  // we need to pass a string vs a function so we manually stringified the function
  return promisify(
    driver.executeAsyncScript<AxeResults>(`
      const callback = arguments[arguments.length - 1];
      const context = ${JSON.stringify(context)} || document;
      const options = ${JSON.stringify(options)} || {};
      const config = ${JSON.stringify(config)} || null;
      if (config) {
        window.axe.configure(config);
      }
      window.axe.run(context, options).then(callback);
    `)
  );
}

/**
 * Selenium-webdriver thenable aren't chainable. This fixes it.
 */
function promisify<T>(thenable: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    thenable.then(resolve, reject);
  });
}
