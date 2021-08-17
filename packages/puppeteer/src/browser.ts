// This module encapsulates the browser environment
import * as Axe from 'axe-core';
import { PartialResults } from './types';

// Expect axe to be set up.
// Tell Typescript that there should be a global variable called `axe` that follows
// the shape given by the `axe-core` typings (the `run` and `configure` functions).
declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    axe: typeof Axe;
  }
}

export function pageIsLoaded(): boolean {
  return document.readyState === 'complete';
}

export function axeRunPartialSupport(): boolean {
  return typeof window.axe.runPartial === 'function';
}

export function axeConfigure(config?: Axe.Spec): void {
  if (config) {
    window.axe.configure(config);
  }
  window.axe.configure({
    allowedOrigins: ['<unsafe_all_origins>'],
    branding: { application: 'axe-puppeteer' }
  });
}

export function axeGetFrameContext(
  context: Axe.ElementContext
): Axe.FrameContext[] {
  return window.axe.utils.getFrameContexts(context);
}

export function axeShadowSelect(
  axeSelector: Axe.CrossTreeSelector
): Element | null {
  return window.axe.utils.shadowSelect(axeSelector);
}

export function axeRunPartial(
  context: Axe.ContextObject,
  options: Axe.RunOptions
): Promise<Axe.PartialResult> {
  return window.axe.runPartial(context, options);
}

export function axeFinishRun(
  partials: PartialResults,
  options: Axe.RunOptions
): Promise<Axe.AxeResults> {
  return window.axe.finishRun(partials, options);
}

// Defined at top-level to clarify that it can't capture variables from outer scope.
export function axeRunLegacy(
  context?: Axe.ContextObject,
  options?: Axe.RunOptions
): Promise<Axe.AxeResults> {
  return window.axe.run(context || document, options || {});
}
