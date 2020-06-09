import { error, WebDriver, WebElement } from 'selenium-webdriver';
import { Spec as AxeConfig } from 'axe-core';

const { StaleElementReferenceError } = error;

interface Params {
  driver: WebDriver;
  config: AxeConfig;
  axeSource?: string | null;
  options?: Options;
}

export interface Options {
  noSandbox?: boolean;
  logIframeErrors?: boolean;
}

class AxeInjector {
  private driver: WebDriver;
  private axeSource: string;
  private config: string;
  private options: Options;
  private didLogError: boolean;

  constructor({ driver, config, axeSource = null, options = {} }: Params) {
    this.driver = driver;
    this.axeSource = axeSource || require('axe-core').source;
    this.config = config ? JSON.stringify(config) : '';
    this.options = options;

    // default is set to true so it does not rewrite iframes in the DOM
    // validates the value being passed to sandbox as a boolean
    this.options.noSandbox =
      typeof this.options.noSandbox === 'boolean'
        ? this.options.noSandbox
        : false;

    // default logIframeErrors to true so it retains the original behavior
    this.options.logIframeErrors =
      typeof this.options.logIframeErrors === 'boolean'
        ? this.options.logIframeErrors
        : true;

    this.didLogError = false;
    this.errorHandler = this.errorHandler.bind(this);
  }

  // Single-shot error handler. Ensures we don't log more than once.
  private errorHandler(err: Error): void {
    // We've already "warned" the user. No need to do it again (mostly for backwards compatiability)
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
      // eslint-disable-next-line no-console
      console.error(msg);
      return;
    }

    throw new Error(msg);
  }

  // Get axe-core source (and configuration)
  private get script(): string {
    return `
      ${this.axeSource}
      ${this.config ? `axe.configure(${this.config})` : ''}
      axe.configure({ branding: { application: 'webdriverjs' } })
    `;
  }

  // Inject into the provided `frame` and its child `frames`
  private async handleFrame(framePath: WebElement[]): Promise<void> {
    // Move back to the top-most frame
    await this.driver.switchTo().defaultContent();
    // Switch context to the frame and inject our `script` into it
    for (const frame of framePath) {
      await this.driver.switchTo().frame(frame);
    }
    // By default we do not remove the sandbox attr from iframe unless user specifies
    if (this.options.noSandbox) {
      // reinject any sandboxed iframes without the sandbox attribute so we can scan
      await this.sandboxBuster();
    }
    await this.driver.executeScript(this.script);

    // Get all of <iframe>s at this level
    const frames = await this.driver.findElements({ tagName: 'iframe' });

    // Inject into each frame. Handling errors to ensure an issue on a single frame won't stop the rest of the injections.
    for (const childFrame of frames) {
      framePath.push(childFrame);
      try {
        await this.handleFrame(framePath);
      } catch (err) {
        this.errorHandler(err);
      } finally {
        framePath.pop();
      }
    }
  }

  private async sandboxBuster(): Promise<void> {
    // outer promise needed because `executeAsyncScript`
    // does not return a "real promise" (ManagedPromise)
    // and we want to await it.
    return new Promise((resolve, reject) => {
      /* eslint-disable no-undef */
      this.driver
        .executeAsyncScript(function (callback: () => void) {
          const iframes: HTMLIFrameElement[] = Array.from(
            document.querySelectorAll('iframe[sandbox]')
          );

          const removeSandboxAttr = (clone: HTMLIFrameElement) => (
            attr: Attr
          ): void => {
            if (attr.name === 'sandbox') return;
            clone.setAttribute(attr.name, attr.value);
          };

          const replaceSandboxedIframe = (
            iframe: HTMLIFrameElement
          ): Promise<void> => {
            const clone = document.createElement('iframe');
            const promise = new Promise<void>(iframeLoaded => {
              clone.onload = (): void => iframeLoaded();
            });
            Array.from(iframe.attributes).forEach(removeSandboxAttr(clone));
            iframe.parentElement?.replaceChild(clone, iframe);
            return promise;
          };

          Promise.all(iframes.map(replaceSandboxedIframe)).then(callback);
        })
        /* eslint-enable no-undef */
        // resolve the outer promise
        .then(() => resolve())
        .catch((err: Error) => reject(err));
    });
  }
  // Inject into all frames.
  private async injectIntoAllFrames(): Promise<void> {
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

    // Get all of <iframe>s at this level
    const frames = await this.driver.findElements({ tagName: 'iframe' });

    // Inject the script into all child frames. Handle errors to ensure we don't stop execution if we fail to inject.
    for (const childFrame of frames) {
      try {
        await this.handleFrame([childFrame]);
      } catch (err) {
        this.errorHandler(err);
      }
    }

    // Move back to the top-most frame
    return this.driver.switchTo().defaultContent();
  }

  // Inject axe, invoking the provided callback when done
  public inject(callback: (err?: Error) => void): void {
    this.injectIntoAllFrames()
      .then(() => callback())
      .catch(e => {
        if (this.options.logIframeErrors) {
          return callback();
        }

        callback(e);
      });
  }
}

export default AxeInjector;
