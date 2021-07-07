// This module encapsulates the browser environment
import * as Axe from 'axe-core';

// Expect axe to be set up.
// Tell Typescript that there should be a global variable called `axe` that follows
// the shape given by the `axe-core` typings (the `run` and `configure` functions).
declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    axe: typeof Axe;
  }
}

// Defined at top-level to clarify that it can't capture variables from outer scope.
export function runAxe(
  context?: Axe.ElementContext,
  options?: Axe.RunOptions
): Promise<Axe.AxeResults> {
  return window.axe.run(context || document, options || {});
}

export function pageIsLoaded(): boolean {
  return document.readyState === 'complete';
}

export function configureAxe(config?: Axe.Spec): void {
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

export function axeRunPartial(
  context: Axe.ElementContext,
  options: Axe.RunOptions
): Promise<Axe.PartialResult> {
  return window.axe.runPartial(context, options);
}

export function axeFinishRun(
  frameResults: Axe.PartialResult[],
  options: Axe.RunOptions
): Promise<Axe.AxeResults> {
  return window.axe.finishRun(frameResults, options);
}

export function axeShadowSelect(
  axeSelector: string | string[]
): Element | null {
  /* Find an element in shadow or light DOM trees, using an axe selector */
  function shadowQuerySelector(
    axeSelector: string[],
    doc: Document | ShadowRoot
  ): Element | null {
    const selectorStr = axeSelector.shift();
    const elm = selectorStr ? doc.querySelector(selectorStr) : null;
    if (axeSelector.length === 0) {
      return elm;
    }
    if (!elm?.shadowRoot) {
      return null;
    }
    return shadowQuerySelector(axeSelector, elm.shadowRoot);
  }

  const selector = Array.isArray(axeSelector)
    ? [...axeSelector]
    : [axeSelector];
  return shadowQuerySelector(selector, document);
}
