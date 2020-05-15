import * as Axe from 'axe-core';

export type AnalyzeCB = (err: Error | null, result?: Axe.AxeResults) => void;

export interface IPageOptions {
  opts?: any;
  source?: string;
}
