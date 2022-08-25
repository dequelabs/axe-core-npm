import type { WebDriver } from 'selenium-webdriver';
import type { Spec, AxeResults, BaseSelector } from 'axe-core';
import axe from 'axe-core';

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
  error: Error | null,
  results: AxeResults | null
) => void;

export type InjectCallback = (err?: Error) => void;

export type PartialResults = Parameters<typeof axe.finishRun>[0];

export type Selector = BaseSelector | BaseSelector[];
