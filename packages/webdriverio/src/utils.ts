import type {
  AxeResults,
  ElementContext,
  PartialResult,
  ContextObject
} from 'axe-core';
import type {
  BrowserObject,
  AxeRunPartialParams,
  AxeGetFrameContextParams,
  AxeRunLegacyParams,
  AxeFinishRunParams,
  AxeSourceInjectResponse,
  AxeSourceInjectParams
} from './types';

/**
 * Validates that the client provided is WebdriverIO v5 or v6.
 * @param {BrowserObject} client
 * @returns {boolean}
 */

export const isWebdriverClient = (client: BrowserObject): boolean => {
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
 * @param {Array} include
 * @param {Array} exclude
 * @returns {ElementContext}
 */

export const normalizeContext = (
  includes: string[],
  excludes: string[],
  disabledFrameSelectors: string[]
): ContextObject => {
  const base: ContextObject = {
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
 * @param {Error} error
 * @returns {void}
 */

export const logOrRethrowError = (error: Error): void => {
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

export const axeSourceInject = async ({
  client,
  axeSource
}: AxeSourceInjectParams): Promise<AxeSourceInjectResponse> => {
  return promisify(
    // Had to use executeAsync() because we could not use multiline statements in client.execute()
    // we were able to return a single boolean in a line but not when assigned to a variable.
    client.executeAsync(`
      var callback = arguments[arguments.length - 1];
      ${axeSource};
      window.axe.configure({
        branding: { application: 'webdriverio' }
      });
      var runPartial = typeof window.axe.runPartial === 'function';
      callback(runPartial);
    `)
  );
};

export const axeRunPartial = ({
  client,
  context,
  options
}: AxeRunPartialParams): Promise<PartialResult> => {
  return promisify(
    client.executeAsync(`
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)} || document;
      var options = ${JSON.stringify(options)} || {};
      window.axe.runPartial(context, options).then(callback);    
    `)
  );
};

export const axeGetFrameContext = ({
  client,
  context
}: AxeGetFrameContextParams): Promise<any[]> => {
  return promisify(
    // Had to use executeAsync() because we could not use multiline statements in client.execute()
    // we were able to return a single boolean in a line but not when assigned to a variable.
    client.executeAsync(`
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)};
      var frameContexts = window.axe.utils.getFrameContexts(context);
      frameContexts = frameContexts.map(function (frameContext) {
        return Object.assign(frameContext, {
          href: window.location.href, // For debugging
        });
      });
      callback(frameContexts)
    `)
  );
};

export const axeRunLegacy = ({
  client,
  context,
  options,
  config
}: AxeRunLegacyParams): Promise<AxeResults> => {
  return promisify(
    client.executeAsync(`
      var callback = arguments[arguments.length - 1];
      var context = ${JSON.stringify(context)} || document;
      var options = ${JSON.stringify(options)} || {};
      var config = ${JSON.stringify(config)} || null;
      if (config) {
        window.axe.configure(config);
      }
      window.axe.run(context, options).then(callback); 
    `)
  );
};

export const axeFinishRun = ({
  client,
  axeSource,
  partialResults,
  options
}: AxeFinishRunParams): Promise<AxeResults> => {
  return promisify(
    client.executeAsync(`
    var callback = arguments[arguments.length - 1];
    ${axeSource};
    window.axe.configure({
      branding: { application: 'webdriverio' }
    });

    var partialResults = ${JSON.stringify(partialResults)};
    var options = ${JSON.stringify(options || {})};
    window.axe.finishRun(partialResults, options).then(callback);
    `)
  );
};
