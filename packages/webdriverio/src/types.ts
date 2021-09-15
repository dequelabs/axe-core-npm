import type { Browser, MultiRemoteBrowser, Element } from 'webdriverio';
import type { AxeResults, ElementContext, RunOptions, Spec } from 'axe-core';
import * as axe from 'axe-core';

export type WdioBrowser =
  | Browser<'async'>
  | Browser<'sync'>
  | MultiRemoteBrowser<'async'>
  | MultiRemoteBrowser<'sync'>;

export type WdioElement = Element<'async'> | Element<'sync'>;

export type CallbackFunction = (
  error: string | null,
  results: AxeResults | null
) => void;

export interface Options {
  client: WdioBrowser;
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
