// This module encapsulates the browser environment
import * as Axe from 'axe-core';

// Expect axe to be set up.
// Tell Typescript that there should be a global variable called `axe` that follows
// the shape given by the `axe-core` typings (the `run` and `configure` functions).
declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    axe: typeof Axe;
    partialResults: string;
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

export function axeFinishRun(options: Axe.RunOptions): Promise<Axe.AxeResults> {
  return window.axe.finishRun(JSON.parse(window.partialResults), options);
}

// Defined at top-level to clarify that it can't capture variables from outer scope.
export function axeRunLegacy(
  context?: Axe.ContextObject,
  options?: Axe.RunOptions
): Promise<Axe.AxeResults> {
  return window.axe.run(context || document, options || {});
}

export function chunkResultString(chunk: string) {
  window.partialResults ??= '';
  window.partialResults += chunk;
}

// a frame that blocks scripts skips event listeners and never fires timers,
// so axe.runPartial would hang in it
export const assertScriptsRun = `(function () {
  var ran = false;
  try {
    var target = document.createElement('div');
    target.addEventListener('axe', function () { ran = true; });
    var event = document.createEvent('Event');
    event.initEvent('axe', false, false);
    target.dispatchEvent(event);
  } catch (e) {
    return;
  }
  if (!ran) {
    throw new Error('Frame cannot run scripts');
  }
})();
`;
