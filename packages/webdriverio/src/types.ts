import type { Browser } from 'webdriverio';
import type { AxeResults, BaseSelector } from 'axe-core';
import * as axe from 'axe-core';

export type CallbackFunction = (
  error: string | null,
  results: AxeResults | null
) => void;

export interface Options {
  client: Browser;
  axeSource?: string;
}

declare global {
  interface Window {
    axe: typeof axe;
  }
  interface Error {
    seleniumStack?: {
      type?: 'StaleElementReference';
    };
  }
}

export type PartialResults = Parameters<typeof axe.finishRun>[0];

export type Selector = BaseSelector | BaseSelector[];
