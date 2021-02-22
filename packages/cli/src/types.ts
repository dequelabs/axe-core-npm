import type { AxeResults } from 'axe-core';

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
