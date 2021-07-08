import type { AxeResults, ElementContext, RunOptions, Spec } from 'axe-core';
import * as axe from 'axe-core';
import {
  Browser ,
  MultiRemoteBrowser,
  Element as WebDriverElement,
} from 'webdriverio';

export type BrowserObject =
  | Browser<'sync'>
  | Browser<'async'>
  | MultiRemoteBrowser<'sync'>
  | MultiRemoteBrowser<'async'>


export type Element = WebDriverElement<'sync'> | WebDriverElement<'async'>;

export interface AnalyzePageParams {
  context: ElementContext | null;
  options: RunOptions | null;
  config: Spec | null;
}

export interface AnalyzePageResponse {
  results: AxeResults | null;
  error: Error | string | null;
}

export type DoneFunction = ({ error, results }: AnalyzePageResponse) => void;

export type CallbackFunction = (
  error: string | null,
  results: AxeResults | null
) => void;

export interface Options {
  client: BrowserObject;
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
