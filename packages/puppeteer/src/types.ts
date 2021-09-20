import type * as Axe from 'axe-core';
import * as axe from 'axe-core';

export type AnalyzeCB = (err: Error | null, result?: Axe.AxeResults) => void;

export interface IPageOptions {
  opts?: any;
  source?: string;
}

export type PartialResults = Parameters<typeof axe.finishRun>[0];
