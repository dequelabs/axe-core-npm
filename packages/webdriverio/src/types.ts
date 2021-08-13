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

export interface AxeRunPartialParams {
  client: BrowserObject;
  context?: ElementContext;
  options?: RunOptions;
}

export interface AxeGetFrameContextParams {
  client: BrowserObject;
  context: ElementContext;
}

export interface AxeRunLegacyParams extends AxeRunPartialParams {
  config?: Spec;
}

export interface AxeSourceInjectParams {
  client: BrowserObject;
  axeSource: string;
}

export interface AxeFinishRunParams extends AxeSourceInjectParams {
  partialResults: PartialResults;
  options: RunOptions;
}

export interface AxeSourceInjectResponse {
  runPartialSupported: boolean;
}

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

export type PartialResults = Parameters<typeof axe.finishRun>[0];
