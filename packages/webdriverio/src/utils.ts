import assert from 'assert';
import type { Browser } from 'webdriverio';
import type {
  AxeResults,
  PartialResult,
  RunOptions,
  Spec,
  PartialResults,
  SerialSelectorList,
  SerialContextObject
} from 'axe-core';

export const FRAME_LOAD_TIMEOUT = 1000

/**
 * Validates that the client provided is WebdriverIO v5 or v6.
 */
export const isWebdriverClient = (client: Browser): boolean => {
  if (!client || typeof client !== 'object') {
    return false;
  }

  if (typeof client.execute !== 'function') {
    return false;
  }

  if (typeof client.switchToFrame !== 'function') {
    return false;
  }

  return true;
};

/**
 * Get running context
 */
export const normalizeContext = (
  includes: SerialSelectorList,
  excludes: SerialSelectorList,
  disabledFrameSelectors: string[]
): SerialContextObject => {
  const base: SerialContextObject = {
    exclude: []
  };
  if (excludes.length && Array.isArray(base.exclude)) {
    base.exclude.push(...excludes);
  }
  if (disabledFrameSelectors.length && Array.isArray(base.exclude)) {
    const frameExcludes = disabledFrameSelectors.map(frame => [frame, '*']);
    base.exclude.push(...frameExcludes);
  }
  if (includes.length) {
    base.include = includes;
  }
  return base;
};

/**
 * Checks to make sure that the error thrown was not a stale iframe
 */
export const logOrRethrowError = (error: unknown): void => {
  assert(error instanceof Error, 'An unknown error occurred');
  if (
    error?.seleniumStack?.type === 'StaleElementReference' ||
    error.name === 'stale element reference'
  ) {
    console.error(
      'Tried to inject into a removed iframe. This will not affect the analysis of the rest of the page but you might want to ensure the page has finished updating before starting the analysis.'
    );
  } else {
    throw new Error(error.message);
  }
};

/**
 * Selenium-webdriver thenable aren't chainable. This fixes it.
 */
const promisify = <T>(thenable: Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    thenable.then(resolve, reject);
  });
};

export const axeSourceInject = async (
  client: Browser,
  axeSource: string
): Promise<{ runPartialSupported: boolean }> => {
  await assertFrameReady(client);
  return promisify(
    // Had to use executeAsync() because we could not use multiline statements in client.execute()
    // we were able to return a single boolean in a line but not when assigned to a variable.
    client.executeAsync(`
      var callback = arguments[arguments.length - 1];
      ${axeSource};
      window.axe.configure({
        branding: { application: 'webdriverio' }
      });
      var runPartial = typeof window.axe?.runPartial === 'function';
      callback(runPartial);
    `)
  );
};

async function assertFrameReady(client: Browser): Promise<void> {
  // Wait so that we know there is an execution context.
  // Assume that if we have an html node we have an execution context.
  try {
    /*
      When using the devtools protocol trying to call
      client.execute() on an unloaded iframe would cause
      the code to hang indefinitely since it is using
      Puppeteer which freezes on unloaded iframes. Set a
      race timeout in order to handle that. Code taken
      from our @axe-core/puppeteer utils function.
      @see https://github.com/dequelabs/axe-core-npm/issues/727
    */
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject();
      }, FRAME_LOAD_TIMEOUT)
    });
    const executePromise = client.execute(() => {
      return document.readyState === 'complete'
    });
    const readyState = await Promise.race([timeoutPromise, executePromise]);
    assert(readyState);
  } catch {
    throw new Error('Page/Frame is not ready');
  }
}

export const axeRunPartial = (
  client: Browser,
  context?: SerialContextObject,
  options?: RunOptions
): Promise<PartialResult> => {
  return promisify(
    client
      .executeAsync<string, never>(
        `
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)} || document;
      var options = ${JSON.stringify(options)} || {};
      window.axe.runPartial(context, options).then(function (partials) {
        callback(JSON.stringify(partials))
      });`
      )
      .then((r: string) => deserialize<PartialResult>(r))
  );
};

export const axeGetFrameContext = (
  client: Browser,
  context: SerialContextObject
): Promise<any[]> => {
  return promisify(
    // Had to use executeAsync() because we could not use multiline statements in client.execute()
    // we were able to return a single boolean in a line but not when assigned to a variable.
    client.executeAsync(`
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)};
      var frameContexts = window.axe.utils.getFrameContexts(context);
      callback(frameContexts)
    `)
  );
};

export const axeRunLegacy = (
  client: Browser,
  context: SerialContextObject,
  options: RunOptions,
  config?: Spec
): Promise<AxeResults> => {
  return promisify(
    client
      .executeAsync<string, never>(
        `var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)} || document;
      var options = ${JSON.stringify(options)} || {};
      var config = ${JSON.stringify(config)} || null;
      if (config) {
        window.axe.configure(config);
      }
      window.axe.run(context, options).then(function (axeResults) {
        callback(JSON.stringify(axeResults))
      });`
      )
      .then((r: string) => deserialize<AxeResults>(r))
  );
};

export const axeFinishRun = (
  client: Browser,
  axeSource: string,
  partialResults: PartialResults,
  options: RunOptions
): Promise<AxeResults> => {
  // executeScript has a size limit of ~32 million characters so we'll need
  // to split partialResults into chunks if it exceeds that limit.
  // since we need to stringify twice we need to leave room for the double escaped quotes
  const sizeLimit = 15_000_000;
  const partialString = JSON.stringify(
    partialResults.map(res => JSON.stringify(res))
  );
  function chunkResults(result: string): Promise<void> {
    const chunk = JSON.stringify(result.substring(0, sizeLimit));
    return promisify(
      client.execute(
        `
        window.partialResults ??= '';
        window.partialResults += ${chunk};
        `
      )
    ).then(() => {
      if (result.length > sizeLimit) {
        return chunkResults(result.substr(sizeLimit));
      }
    });
  }

  return chunkResults(partialString)
    .then(() => {
      return promisify(
        client.executeAsync<string, never>(
          `var callback = arguments[arguments.length - 1];
      ${axeSource};
      window.axe.configure({
        branding: { application: 'webdriverio' }
      });

      var partialResults = JSON.parse(window.partialResults).map(res => JSON.parse(res));
      var options = ${JSON.stringify(options || {})};
      window.axe.finishRun(partialResults, options).then(function (axeResults) {
        callback(JSON.stringify(axeResults))
      });`
        )
      );
    })
    .then((r: string) => deserialize<AxeResults>(r));
};

export const configureAllowedOrigins = (client: Browser): Promise<void> => {
  return promisify(
    client.execute(`
      window.axe.configure({ allowedOrigins: ['<unsafe_all_origins>'] })
    `)
  );
};

/**
 * JSON.parse wrapper with types
 *
 * Unlike JSON.parse, WDIO converts { foo: undefined } to { foo: null }.
 * This might throw axe-core off, so we're serializing this ourselves
 */
function deserialize<T>(s: string): T {
  return JSON.parse(s) as T;
}
