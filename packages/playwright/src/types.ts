import type { Page } from 'playwright';
import type {
  RunOptions,
  AxeResults,
  ContextObject,
  CrossTreeSelector,
  PartialResult
} from 'axe-core';

export type PartialResults = PartialResult | null;

export interface AnalyzePageParams {
  context: ContextObject;
  options: RunOptions | null;
}

export interface AxePlaywrightParams {
  page: Page;
  axeSource?: string;
}

export interface AnalyzePageResponse {
  results: AxeResults | null;
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
