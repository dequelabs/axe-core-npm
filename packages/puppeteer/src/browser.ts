// This module encapsulates the browser enviromnent
import * as Axe from 'axe-core'

// Expect axe to be set up.
// Tell Typescript that there should be a global variable called `axe` that follows
// the shape given by the `axe-core` typings (the `run` and `configure` functions).
declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    axe: typeof Axe
  }
}
// Defined at top-level to clarify that it can't capture variables from outer scope.
export function runAxe(
  config?: Axe.Spec,
  context?: Axe.ElementContext,
  options?: Axe.RunOptions
) {
  if (config) {
    window.axe.configure(config)
  }

  const brandingConfig = {
    branding: {
      application: 'axe-puppeteer'
    }
  }
  // Cast needed since we only set `branding.application` and `branding` expects
  // to also have a `brand` field.
  // We don't set `brand` since `axe-webdriverjs` doesn't.
  // TODO: Once axe-core 3.1.3 is released remove the cast (as that release fixes the types)
  window.axe.configure(brandingConfig as Axe.Spec)

  return window.axe.run(context || document, options || {})
}

export function pageIsLoaded() {
  return document.readyState === 'complete'
}
