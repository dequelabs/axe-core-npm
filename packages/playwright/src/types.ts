import type { Page } from 'playwright';
import type { ElementContext, RunOptions, AxeResults } from 'axe-core';

export interface AnalyzePageParams {
  context: ElementContext | null;
  options: RunOptions | null;
}

export interface NormalizeContextResponse {
  include?: string[];
  exclude?: string[];
}

export interface AxePlaywrightParams {
  page: Page;
}

export interface AnalyzePageResponse {
  results: AxeResults | null;
  error: string | null;
}
