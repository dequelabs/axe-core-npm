import type { AxeResults, BaseSelector } from 'axe-core';
import * as axe from 'axe-core';
import { type Browser, type Element } from 'webdriverio';

// this type allows both webdriverio v8 and <=v7 Browser types
// to work in the same codebase. every new feature that we use
// from the Browser type will need to be added to the Pick list
export type WdioBrowser =
  | Browser
  | Pick<
      WebdriverIO.Browser,
      | '$$'
      | '$'
      | 'switchToFrame'
      | 'switchToParentFrame'
      | 'getWindowHandles'
      | 'getWindowHandle'
      | 'switchToWindow'
      | 'createWindow'
      | 'url'
      | 'getTimeouts'
      | 'setTimeout'
      | 'closeWindow'
      | 'executeAsync'
      | 'execute'
    >;

export type WdioElement = Element | WebdriverIO.Element;

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

export type Selector = BaseSelector | BaseSelector[];
