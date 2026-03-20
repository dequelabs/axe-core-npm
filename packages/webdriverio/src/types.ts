import type { AxeResults, BaseSelector } from 'axe-core';
import * as axe from 'axe-core';

export interface WdioElement {
  isExisting(): Promise<boolean>;
}

// Shared methods present in all supported WDIO versions.
// Hand-written rather than Pick<WebdriverIO.Browser, ...> because:
//   - WebdriverIO.Browser.$$ returns ChainablePromiseArray, whose awaited type
//     doesn't expose .concat(), breaking usage in index.ts.
//   - Several picked methods carry a `this: Browser` context constraint that
//     TypeScript enforces even through our narrower union type.
interface WdioBrowserBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $$(selector: string): PromiseLike<any>;
  $(selector: string): PromiseLike<WdioElement | undefined>;
  execute<T = unknown>(
    script: string | ((...args: unknown[]) => T),
    ...args: unknown[]
  ): Promise<T>;
  executeAsync<T = unknown>(script: string, ...args: unknown[]): Promise<T>;
  getTimeouts(): Promise<{ pageLoad?: number }>;
  setTimeout(options: { pageLoad?: number }): Promise<void>;
  url(url: string): Promise<void | string>;
  getWindowHandles(): Promise<string[]>;
  getWindowHandle(): Promise<string>;
  createWindow(type: 'tab' | 'window'): Promise<{ handle: string }>;
  closeWindow(): Promise<void>;
}

// WDIO v5–v8: frame/window navigation via the legacy API.
interface WdioBrowserLegacy extends WdioBrowserBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switchToFrame(element: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switchToParentFrame(): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switchToWindow(handle: any): Promise<any>;
}

// WDIO v9: frame/window navigation via the new API.
// switchFrame / switchWindow are not on the v8 global type, so declared manually.
interface WdioBrowserV9 extends WdioBrowserBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switchFrame(element: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switchWindow(matcher: any): Promise<any>;
}

/**
 * A real WDIO browser object from any supported version (v5–v9).
 * The discriminant is the presence of `switchFrame` (v9) vs `switchToFrame` (v5–v8).
 */
export type WdioBrowser = WdioBrowserLegacy | WdioBrowserV9;

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
