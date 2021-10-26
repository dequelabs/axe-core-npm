import type { Page } from 'playwright';
import type {
  RunOptions,
  AxeResults,
  ContextObject,
  CrossTreeSelector,
  PartialResult,
  BaseSelector
} from 'axe-core';

export type PartialResults = PartialResult | null;

export interface AnalyzePageParams {
  context: ContextObject;
  options: RunOptions | null;
}

// utilise axe-core types to allow chaining on include and exclude
// @see https://github.com/dequelabs/axe-core-npm/issues/389
export type AxeSelector = BaseSelector | BaseSelector[];

export type AxeSelectors = Array<AxeSelector>;

export interface AxePlaywrightParams {
  page: Page;
  axeSource?: string;
}

export interface AnalyzePageResponse {
  results: AxeResults;
  error: string | null;
}

export interface GetFrameContextsParams {
  context: ContextObject;
}

export interface ShadowSelectParams {
  frameSelector: CrossTreeSelector;
}

export interface RunPartialParams {
  context: ContextObject;
  options: RunOptions;
}

export interface FinishRunParams {
  partialResults: PartialResults[];
  options: RunOptions;
}
