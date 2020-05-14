import * as Axe from 'axe-core';

export type AnalyzeCB = (err: Error | null, result?: Axe.AxeResults) => void;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IPageOptions {
  opts?: any;
  source?: string;
}
