import type { AxeResults, ElementContext, RunOptions, Spec } from 'axe-core';
import * as axe from 'axe-core';
import {
  BrowserObject as BrowserObjectSync,
  Element as ElementSync,
  MultiRemoteBrowserObject as MultiRemoteBrowserObjectSync
} from '@wdio/sync';
import {
  BrowserObject as BrowserObjectAsync,
  MultiRemoteBrowserObject as MultiRemoteBrowserObjectAsync,
  Element as ElementAsync
} from 'webdriverio';

export type BrowserObject =
  | BrowserObjectAsync
  | BrowserObjectSync
  | MultiRemoteBrowserObjectAsync
  | MultiRemoteBrowserObjectSync;

export type Element = ElementAsync | ElementSync;

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
