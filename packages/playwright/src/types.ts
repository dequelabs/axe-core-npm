import type { Page } from 'playwright-core';
import type {
  RunOptions,
  AxeResults,
  ContextObject,
  CrossTreeSelector,
  PartialResult,
  SerialContextObject,
  Rule,
  Check,
  Standards,
  Locale
} from 'axe-core';

export type PartialResults = PartialResult | null;

export interface AnalyzePageParams {
  context: SerialContextObject;
  options: RunOptions;
}

export interface AxePlaywrightParams {
  page: Page;
  axeSource?: string;
  axeConfigOptions?: AxeConfigOptions;
}

export interface AxeConfigOptions {
  branding?: string;
  checks?: Check[];
  rules?: Rule[];
  standards?: Standards;
  locale?: Locale;
  axeVersion?: string;
  disableOtherRules?: boolean;
  noHtml?: boolean;
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
