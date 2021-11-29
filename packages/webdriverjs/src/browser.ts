import {
  AxeResults,
  ContextObject,
  FrameContext,
  RunOptions,
  Spec,
  PartialResult
} from 'axe-core';
import { WebDriver, WebElement } from 'selenium-webdriver';

type FrameContextWeb = FrameContext & {
  frame: WebElement;
  href: string;
};

/**
 * Selenium-webdriver thenable aren't chainable. This fixes it.
 */
function promisify<T>(thenable: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    thenable.then(resolve, reject);
  });
}

// https://github.com/vercel/pkg/issues/676
// we need to pass a string vs a function so we manually stringified the function
// There are no try/catch blocks needed in these scripts. If an error occurs
// Selenium pass them onto the catch block.

export function axeSourceInject(
  driver: WebDriver,
  axeSource: string,
  config: Spec | null
): Promise<{ runPartialSupported: boolean }> {
  return promisify(
    driver.executeScript<{ runPartialSupported: boolean }>(`
      ${axeSource};
      window.axe.configure({
        branding: { application: 'webdriverjs' }
      });
      var config = ${JSON.stringify(config)};
      if (config) {
        window.axe.configure(config);
      }
      var runPartial = typeof window.axe.runPartial === 'function';
      return { runPartialSupported: runPartial };
    `)
  );
}

export function axeRunPartial(
  driver: WebDriver,
  context: ContextObject,
  options: RunOptions
): Promise<string> {
  return promisify(
    driver.executeAsyncScript<string>(`
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)} || document;
      var options = ${JSON.stringify(options)} || {};
      window.axe.runPartial(context, options).then(res => JSON.stringify(res)).then(callback);
    `)
  );
}

export function axeFinishRun(
  driver: WebDriver,
  axeSource: string,
  config: Spec | null,
  partialResults: Array<string>,
  options: RunOptions
): Promise<AxeResults> {
  // Inject source and configuration a second time with a mock "this" context,
  // to make it impossible to sniff the global window.axe for results.
  return promisify(
    driver
      .executeAsyncScript<string>(
        `
      var callback = arguments[arguments.length - 1];

      ${axeSource};
      window.axe.configure({
        branding: { application: 'webdriverjs' }
      });
      var config = ${JSON.stringify(config)};
      if (config) {
        window.axe.configure(config);
      }

      var partialResults = ${JSON.stringify(partialResults)};
      partialResults = partialResults.map(res => JSON.parse(res));
      var options = ${JSON.stringify(options || {})};
      window.axe.finishRun(partialResults, options).then(res => JSON.stringify(res)).then(callback);
    `
      )
      .then(res => JSON.parse(res))
  );
}

export function axeGetFrameContext(
  driver: WebDriver,
  context: ContextObject
): Promise<FrameContextWeb[]> {
  return promisify(
    driver.executeScript<FrameContextWeb[]>(`
      var context = ${JSON.stringify(context)}
      var frameContexts = window.axe.utils.getFrameContexts(context);
      return frameContexts.map(function (frameContext) {
        return Object.assign(frameContext, {
          href: window.location.href, // For debugging
          frame: axe.utils.shadowSelect(frameContext.frameSelector)
        });
      });
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
    driver
      .executeAsyncScript<string>(
        `
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)} || document;
      var options = ${JSON.stringify(options)} || {};
      var config = ${JSON.stringify(config)} || null;
      if (config) {
        window.axe.configure(config);
      }
      window.axe.run(context, options).then(res => JSON.stringify(res)).then(callback);
    `
      )
      .then(res => JSON.parse(res))
  );
}
