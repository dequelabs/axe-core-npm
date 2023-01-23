import type {
  AxeResults,
  SerialContextObject,
  SerialSelectorList
} from 'axe-core';
import type { AnalyzePageParams, AnalyzePageResponse } from './types';

/**
 * Get running context
 * @param Array include
 * @param Array exclude
 * @returns SerialContextObject
 */

export const normalizeContext = (
  includes: SerialSelectorList,
  excludes: SerialSelectorList
): SerialContextObject => {
  const base: SerialContextObject = {
    exclude: [],
    include: []
  };
  if (excludes.length && Array.isArray(base.exclude)) {
    base.exclude.push(...excludes);
  }

  if (includes.length) {
    base.include = includes;
  }
  return base;
};

/**
 * Analyze the page.
 * @param AnalyzePageParams analyzeContext
 * @returns Promise<AnalyzePageResponse>
 */

export const analyzePage = ({
  context,
  options
}: AnalyzePageParams): Promise<AnalyzePageResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axeCore = (window as any).axe;

  // Run axe-core
  return axeCore
    .run(context || document, options || {})
    .then((results: AxeResults) => {
      return { error: null, results };
    })
    .catch((err: Error) => {
      return { error: err.message, results: null };
    });
};
