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
  config?: Axe.Spec,
  context?: Axe.ElementContext,
  options?: Axe.RunOptions
): Promise<Axe.AxeResults> {
  if (config) {
    window.axe.configure(config);
  }

  // This prevents axe from running in iframes.
  // TODO: Uncomment when that is fixed in axe-core
  // const brandingConfig = {
  //   branding: {
  //     application: 'axe-puppeteer'
  //   }
  // };
  // window.axe.configure(brandingConfig);

  return window.axe.run(context || document, options || {});
}

export function pageIsLoaded(): boolean {
  return document.readyState === 'complete';
}
