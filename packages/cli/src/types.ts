import type { AxeResults } from 'axe-core';
import type { WebDriver, Builder } from 'selenium-webdriver';

export * from './lib';

export interface EventParams {
  silentMode: boolean;
  timer: boolean;
  cliReporter: (...args: any[]) => void;
  verbose: boolean;
  exit: boolean;
}

export interface EventResponse {
  startTimer: (message: string) => void;
  endTimer: (message: string) => void;
  waitingMessage: (loadDelayTime: number) => void;
  onTestStart: (url: string) => void;
  onTestComplete: (results: AxeResults) => void;
}

export interface WebdriverConfigParams {
  browser: string;
  timeout?: number;
  chromedriverPath?: string;
  path?: string;
  chromeOptions?: string[];
  builder?: Builder;
}

export interface ConfigParams {
  driver: WebDriver;
  timer?: boolean;
  loadDelay?: number;
  axeSource?: string;
  include?: string | string[];
  exclude?: string | string[];
  tags?: string | string[];
  rules?: string | string[];
  disable?: string | string[];
}
