// This module encapsulates the browser enviromnent
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

export function configureAxe(config?: Axe.Spec) {
  if (config) {
    window.axe.configure(config);
  }

  const brandingConfig = {
    branding: {
      application: 'axe-puppeteer'
    }
  };
  window.axe.configure(brandingConfig);
}
