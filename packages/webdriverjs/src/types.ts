import type { WebDriver } from 'selenium-webdriver';
import type { Spec, AxeResults } from 'axe-core';

export interface Options {
  driver: WebDriver;
  axeSource?: string;
  builderOptions?: BuilderOptions;
}

export interface BuilderOptions {
  noSandbox?: boolean;
  logIframeErrors?: boolean;
}

export interface AxeInjectorParams extends Options {
  config?: Spec | null;
}

export type CallbackFunction = (
  error: string | null,
  results: AxeResults | null
) => void;

export type InjectCallback = (err?: Error) => void;
