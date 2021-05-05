import type { AxeResults } from 'axe-core';
import type {
  NormalizeContextResponse,
  AnalyzePageParams,
  AnalyzePageResponse
} from '../types';

/**
 * Get running context
 * @param Array include
 * @param Array exclude
 * @returns (NormalizeContextResponse | null)
 */

export const normalizeContext = (
  include: string[],
  exclude: string[]
): NormalizeContextResponse | null => {
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
