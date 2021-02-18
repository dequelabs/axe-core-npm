import type { AxeResults, ElementContext } from 'axe-core';
import * as webdriverio from 'webdriverio';
import type {
  AnalyzePageParams,
  AnalyzePageResponse,
  DoneFunction,
  BrowserObject
} from '../types';

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
 * @returns {(ElementContext | null)}
 */

export const normalizeContext = (
  include: string[],
  exclude: string[]
): ElementContext | null => {
  if (!exclude.length) {
    if (!include.length) {
      return null;
    }
    return {
      include
    };
  }
  if (!include.length) {
    return {
      exclude
    };
  }
  return {
    include,
    exclude
  };
};

/**
 * Analyze the page.
 * @param {AnalyzePageParams} analyzeContext
 * @param {DoneFunction} done
 * @returns {AnalyzePageResponse}
 */

export const analyzePage = (
  analyzeContext: AnalyzePageParams,
  done: DoneFunction
): AnalyzePageResponse | Promise<void> => {
  const axeCore = window.axe;
  const { options, context } = analyzeContext;

  // Add webdriverio branding
  axeCore.configure({ branding: { application: 'webdriverio' } });
  // Run axe-core
  return axeCore
    .run(context || document, options || {})
    .then((results: AxeResults) => {
      done({ error: null, results });
    })
    .catch((err: Error) => {
      done({ error: err.message, results: null });
    });
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
