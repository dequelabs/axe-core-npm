import type { AxeResults, BaseSelector } from 'axe-core';
import * as axe from 'axe-core';
import { type Element } from 'webdriverio';

export type WdioElement = {
  isExisting(): Promise<boolean>;
};

export interface WdioBrowserLegacy {
  $$(
    selector: string | ((...args: unknown[]) => unknown)
  ): Promise<WebdriverIO.Element[]>;

  $(
    selector: string | ((...args: unknown[]) => unknown)
  ): Promise<WebdriverIO.Element>;

  execute<T = unknown>(
    script: string | ((...args: unknown[]) => T),
    ...args: unknown[]
  ): Promise<T>;

  executeAsync<T = unknown>(
    script: string | ((...args: unknown[]) => void),
    ...args: unknown[]
  ): Promise<T>;

  getTimeouts(): Promise<{
    implicit?: number;
    pageLoad?: number;
    script?: number;
  }>;

  setTimeout(timeouts: {
    implicit?: number;
    pageLoad?: number;
    script?: number;
  }): Promise<void>;

  url(url: string): Promise<void>;

  getWindowHandles(): Promise<string[]>;

  getWindowHandle(): Promise<string>;

  createWindow(
    type: 'tab' | 'window'
  ): Promise<{ handle: string; type: string }>;

  closeWindow(): Promise<void>;

  switchToFrame(id: number | object | null): Promise<void>;

  switchToParentFrame(): Promise<void>;

  switchToWindow(handle: string): Promise<void>;
}

export interface WdioBrowserV8 {
  $$(
    selector:
      | string
      | ((...args: unknown[]) => unknown)
      | object
      | WebdriverIO.Element[]
      | HTMLElement[]
  ): Promise<WebdriverIO.ElementArray>;

  $(
    selector: string | ((...args: unknown[]) => unknown) | object
  ): Promise<WebdriverIO.Element>;

  execute<T = unknown>(
    script: string | ((...args: unknown[]) => T),
    ...args: unknown[]
  ): Promise<T>;

  executeAsync<T = unknown>(
    script: string | ((...args: unknown[]) => void),
    ...args: unknown[]
  ): Promise<T>;

  getTimeouts(): Promise<{
    implicit?: number;
    pageLoad?: number;
    script?: number;
  }>;

  setTimeout(timeouts: {
    implicit?: number;
    pageLoad?: number;
    script?: number;
  }): Promise<void>;

  url(
    path: string,
    options?: {
      wait?: 'none' | 'interactive' | 'networkIdle' | 'complete';
      headers?: Record<string, string>;
      auth?: { user: string; pass: string };
      timeout?: number;
      onBeforeLoad?: () => unknown;
    }
  ): Promise<unknown>;

  getWindowHandles(): Promise<string[]>;

  getWindowHandle(): Promise<string>;

  createWindow(
    type: 'tab' | 'window'
  ): Promise<{ handle: string; type: string }>;

  closeWindow(): Promise<void>;

  switchToFrame(id: number | object | null): Promise<void>;

  switchToParentFrame(): Promise<void>;

  switchToWindow(handle: string): Promise<void>;
}

export type WdioBrowser = WdioBrowserLegacy | WdioBrowserV8;

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
