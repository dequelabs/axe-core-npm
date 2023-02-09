import type { Page } from 'playwright-core';
import type {
  RunOptions,
  AxeResults,
  ContextObject,
  CrossTreeSelector,
  PartialResult,
  SerialContextObject
} from 'axe-core';

export type PartialResults = PartialResult | null;

export interface AnalyzePageParams {
  context: SerialContextObject;
  options: RunOptions;
}

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
  options: RunOptions;
}
