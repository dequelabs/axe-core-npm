import type { WebDriver, WebElement } from 'selenium-webdriver';
import { error } from 'selenium-webdriver';
import { source } from 'axe-core';
import type { AxeInjectorParams, BuilderOptions } from './types';
const { StaleElementReferenceError } = error;

export default class AxeInjectorLegacy {
  private driver: WebDriver;
  private axeSource: string;
  private options: BuilderOptions;
  private config: string;
  private didLogError: boolean;
  constructor({
    driver,
    axeSource,
    builderOptions,
    config
  }: AxeInjectorParams) {
    this.driver = driver;
    this.axeSource = axeSource || source;
    this.config = config ? JSON.stringify(config) : '';
    this.options = builderOptions || {};
    this.didLogError = false;

    this.options.noSandbox =
      typeof this.options.noSandbox === 'boolean'
        ? this.options.noSandbox
        : false;

    this.options.logIframeErrors =
      typeof this.options.logIframeErrors === 'boolean'
        ? this.options.logIframeErrors
        : false;
  }

  /**
   * Checks to make sure that the error thrown was not a stale iframe
   * @param {Error} error
   * @returns {void}
   */

  private errorHandler(err: Error): void {
    // We've already "warned" the user. No need to do it again (mostly for backwards compatibility)
    if (this.didLogError) {
      return;
    }

    this.didLogError = true;
    let msg;
    if (err instanceof StaleElementReferenceError) {
      msg =
        'Tried to inject into a removed iframe. This will not affect the analysis of the rest of the page but you might want to ensure the page has finished updating before starting the analysis.';
    } else {
      msg = 'Failed to inject axe-core into one of the iframes!';
    }

    if (this.options.logIframeErrors) {
      console.error(msg);
      return;
    }

    throw new Error(msg);
  }

  /**
   * Get axe-core source and configurations
   * @returns {String}
   */

  private get script(): string {
    return `
    ${this.axeSource}
    ${this.config ? `axe.configure(${this.config})` : ''}
    axe.configure({
      branding: { application: 'webdriverjs' }
    })
    `;
  }

  /**
   * Removes the `sandbox` attribute from iFrames
   * @returns {Promise<void>}
   */

  private async sandboxBuster(): Promise<void> {
    // outer promise needed because `executeAsyncScript`
    // does not return a "real promise" (ManagedPromise)
    // and we want to await it.
    return new Promise((resolve, reject) => {
      /* eslint-disable no-undef */
      this.driver
        // https://github.com/vercel/pkg/issues/676
        // we need to pass a string vs a function so we manually stringified the function
        .executeAsyncScript(
          `
          var callback = arguments[arguments.length - 1];
          var iframes = Array.from(
            document.querySelectorAll('iframe[sandbox]')
          );
          var removeSandboxAttr = clone => attr => {
            if (attr.name === 'sandbox') return;
            clone.setAttribute(attr.name, attr.value);
          };
          var replaceSandboxedIframe = iframe => {
            var clone = document.createElement('iframe');
            var promise = new Promise(
              iframeLoaded => (clone.onload = iframeLoaded)
            );
            Array.from(iframe.attributes).forEach(removeSandboxAttr(clone));
            iframe.parentElement.replaceChild(clone, iframe);
            return promise;
          };
          Promise.all(iframes.map(replaceSandboxedIframe)).then(callback);
        `
        )
        // resolve the outer promise
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  /**
   * Injects into the provided `frame` and its child `frames`
   * @param {WebElement[]} framePath
   * @returns {Promise<void>}
   */

  private async handleFrame(framePath: WebElement[]): Promise<void> {
    await this.driver.switchTo().defaultContent();

    for (const frame of framePath) {
      await this.driver.switchTo().frame(frame);
    }
    if (this.options.noSandbox) {
      await this.sandboxBuster();
    }

    await this.driver.executeScript(this.script);

    const ifs = await this.driver.findElements({ tagName: 'iframe' });
    const fs = await this.driver.findElements({ tagName: 'frame' });
    const frames = ifs.concat(fs);

    for (const childFrames of frames) {
      framePath.push(childFrames);
      try {
        await this.handleFrame(framePath);
      } catch (error) {
        this.errorHandler(error as any);
      } finally {
        framePath.pop();
      }
    }
  }

  /**
   * Injects into all frames
   * @returns {Promise<void>}
   */
  public async injectIntoAllFrames(): Promise<void> {
    // Ensure we're "starting" our loop at the top-most frame
    await this.driver.switchTo().defaultContent();

    // By default we do not remove the sandbox attr from iframe unless user specifies
    if (this.options.noSandbox) {
      // reinject any sandboxed iframes without the sandbox attribute so we can scan
      await this.sandboxBuster();
    }

    // Inject the script into the top-level
    // XXX: if this `executeScript` fails, we *want* to error, as we cannot run axe-core.
    await this.driver.executeScript(this.script);

    // Get all of <iframe>s and <frame>s at this level
    const ifs = await this.driver.findElements({ tagName: 'iframe' });
    const fs = await this.driver.findElements({ tagName: 'frame' });
    const frames = ifs.concat(fs);

    // Inject the script into all child frames. Handle errors to ensure we don't stop execution if we fail to inject.
    for (const childFrame of frames) {
      try {
        await this.handleFrame([childFrame]);
      } catch (err) {
        this.errorHandler(err as any);
      }
    }

    // Move back to the top-most frame
    return this.driver.switchTo().defaultContent();
  }
}
