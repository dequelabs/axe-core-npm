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
): Promise<boolean> {
  return promisify(
    driver.executeScript<boolean>(`
      try {
        ${axeSource};
        window.axe.configure({
          branding: { application: 'webdriverjs' }
        });
        var config = ${JSON.stringify(config)};
        if (config) {
          window.axe.configure(config);
        }
        return (
          window &&
          window.axe &&
          typeof window.axe.runPartial === 'function'
        )

      } catch (err) {
        return { message: err.message, stack: err.stack };
      }
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
      var callback = arguments[arguments.length - 1];
      try {
        var context = ${JSON.stringify(context)} || document;
        var options = ${JSON.stringify(options)} || {};
        window.axe.runPartial(context, options).then(callback);
      } catch (err) {
        callback({ message: err.message, stack: err.stack });
      }
    `)
  );
}

export function axeFinishRun(
  driver: WebDriver,
  axeSource: string,
  config: Spec | null,
  partialResults: Array<PartialResult | null>,
  options: RunOptions
): Promise<AxeResults> {
  // Inject source and configuration a second time with a mock "this" context,
  // to make it impossible to sniff the global window.axe for results.
  return promisify(
    driver.executeAsyncScript<AxeResults>(`
      var callback = arguments[arguments.length - 1];
      (function () {
        'use strict';
        var window = undefined;
        try {
          ${axeSource};
          this.axe.configure({
            branding: { application: 'webdriverjs' }
          });
          var config = ${JSON.stringify(config)};
          if (config) {
            this.axe.configure(config);
          }
  
          var partialResults = ${JSON.stringify(partialResults)};
          var options = ${JSON.stringify(options || {})};
          this.axe.finishRun(partialResults, options).then(callback);
        } catch (err) {
          callback({ message: err.message, stack: err.stack });
        }
      }).call({ document: document, getComputedStyle: function () {} })
    `)
  );
}

export function axeGetFrameContext(
  driver: WebDriver,
  context: ContextObject
): Promise<FrameContextWeb[]> {
  return promisify(
    driver.executeScript<FrameContextWeb[]>(`
      try {
        var context = ${JSON.stringify(context)}
        var frameContexts = window.axe.utils.getFrameContexts(context);
        return frameContexts.map(function (frameContext) {
          return Object.assign(frameContext, {
            href: window.location.href, // For debugging
            frame: axe.utils.shadowSelect(frameContext.frameSelector)
          });
        });
      } catch (err) {
        return { message: err.message, stack: err.stack };
      }
    `)
  );
}

export function axeSupportsRunPartial(driver: WebDriver): Promise<boolean> {
  return promisify(
    driver.executeScript<boolean>(`
      return (
        window &&
        window.axe &&
        typeof window.axe.runPartial === 'function'
      )
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
      var callback = arguments[arguments.length - 1];
      try {
        var context = ${JSON.stringify(context)} || document;
        var options = ${JSON.stringify(options)} || {};
        var config = ${JSON.stringify(config)} || null;
        if (config) {
          window.axe.configure(config);
        }
        window.axe.run(context, options).then(callback);
      } catch (err) {
        callback({
          message: err.message,
          stack: err.stack
        });
      }
    `)
  );
}

/**
 * Selenium-webdriver thenable aren't chainable. This fixes it.
 */
function promisify<T>(thenable: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    thenable.then(out => {
      if (isSerialError(out)) {
        // Throw if we find an error-like object
        reject(new Error(out.stack));
      }
      resolve(out);
    }, reject);
  });
}

type SerialError = {
  message: string;
  stack: string;
};

function isSerialError(obj: unknown): obj is SerialError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    'stack' in obj
  );
}
