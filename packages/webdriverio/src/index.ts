import fs from 'fs';
import assert from 'assert';
import cssesc from 'cssesc';
import {
  isWebdriverClient,
  normalizeContext,
  logOrRethrowError,
  axeSourceInject,
  axeGetFrameContext,
  axeRunPartial,
  axeFinishRun,
  axeRunLegacy,
  configureAllowedOrigins,
  clientSwitchFrame,
  clientSwitchWindow,
  FRAME_LOAD_TIMEOUT
} from './utils';
import { getFilename } from 'cross-dirname';
import { pathToFileURL } from 'url';

import type {
  RunOptions,
  AxeResults,
  SerialContextObject,
  SerialSelectorList,
  SerialFrameSelector
} from 'axe-core';
import type {
  Options,
  CallbackFunction,
  PartialResults,
  WdioBrowser,
  WdioElement
} from './types';

let axeCorePath = '';
async function loadAxePath() {
  if (typeof require === 'function' && typeof require.resolve === 'function') {
    axeCorePath = require.resolve('axe-core');
  } else {
    const { createRequire } = await import('node:module');
    // `getFilename` is needed because esm's `import.meta.url` is illegal syntax in cjs
    const filename = pathToFileURL(getFilename()).toString();

    const require = createRequire(filename);
    axeCorePath = require.resolve('axe-core');
  }
}
loadAxePath();

export default class AxeBuilder {
  private client: WdioBrowser;
  private axeSource: string;
  private includes: SerialSelectorList = [];
  private excludes: SerialSelectorList = [];
  private option: RunOptions = {};
  private disableFrameSelectors: string[] = [];
  private legacyMode = false;
  private errorUrl: string;

  constructor({ client, axeSource }: Options) {
    assert(
      isWebdriverClient(client),
      'An instantiated WebdriverIO client greater than v5 is required'
    );

    this.client = client;
    this.errorUrl =
      'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverio/error-handling.md';

    if (axeSource) {
      this.axeSource = axeSource;
    } else {
      try {
        this.axeSource = fs.readFileSync(axeCorePath, 'utf-8');
      } catch {
        throw new Error(
          'Unable to find axe-core source. Is axe-core installed?'
        );
      }
    }
  }

  /**
   * Disable injecting axe-core into frame(s) matching the
   * given CSS `selector`. This method may be called any number of times.
   */
  public disableFrame(selector: string): this {
    this.disableFrameSelectors.push(cssesc(selector));
    return this;
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   */
  public include(selector: SerialFrameSelector): this {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   */
  public exclude(selector: SerialFrameSelector): this {
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   */
  public options(options: RunOptions): this {
    this.option = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
   */
  public withRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    this.option.runOnly = {
      type: 'rule',
      values: rules
    };

    return this;
  }

  /**
   * Limit analysis to only specified tags.
   * Cannot be used with `AxeBuilder#withRules`
   */
  public withTags(tags: string | string[]): this {
    tags = Array.isArray(tags) ? tags : [tags];
    this.option.runOnly = {
      type: 'tag',
      values: tags
    };
    return this;
  }

  /**
   * Set the list of rules to skip when running an analysis.
   */
  public disableRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    this.option.rules = {};

    for (const rule of rules) {
      this.option.rules[rule] = { enabled: false };
    }

    return this;
  }

  /**
   * Use frameMessenger with <same_origin_only>
   *
   * This disables use of axe.runPartial() which is called in each frame, and
   * axe.finishRun() which is called in a blank page. This uses axe.run() instead,
   * but with the restriction that cross-origin frames will not be tested.
   */
  public setLegacyMode(legacyMode = true): this {
    this.legacyMode = legacyMode;
    return this;
  }

  /**
   * Performs an analysis and retrieves results.
   */
  public async analyze(callback?: CallbackFunction): Promise<AxeResults> {
    return new Promise((resolve, reject) => {
      return this.analyzePromise()
        .then((results: AxeResults) => {
          callback?.(null, results);
          resolve(results);
        })
        .catch((err: Error) => {
          // When using a callback, do *not* reject the wrapping Promise. This prevents having to handle the same error twice.
          if (callback) {
            callback(err.message, null);
          } else {
            reject(err);
          }
        });
    });
  }

  /**
   * Get axe-core source and configurations
   */
  private get script(): string {
    return `
        ${this.axeSource}
        axe.configure({
          branding: { application: 'webdriverio' }
        })
        `;
  }

  /**
   * Injects `axe-core` into all frames.
   */
  private async inject(
    browsingContext: WdioElement | null = null,
    browsingContextId: string | null = null
  ): Promise<void> {
    // Navigate to the target browsing context and capture its BiDi context ID.
    // In WDIO v9 BiDi mode, switchFrame returns the browsing context ID string,
    // which we use later to safely re-enter this frame after deep injection.
    // In Classic WebDriver mode, switchFrame returns undefined and we fall back
    // to re-entering via the original element reference.
    if (browsingContext !== null) {
      const result = await clientSwitchFrame(this.client, browsingContext);
      if (typeof result === 'string') {
        browsingContextId = result;
      }
    } else {
      await clientSwitchFrame(this.client, null);
    }

    const runPartialSupported = await axeSourceInject(
      this.client,
      this.axeSource
    );

    if (!this.legacyMode && !runPartialSupported) {
      await configureAllowedOrigins(this.client);
    }

    const frames = (await this.client.$$(this.frameSelector())) || [];
    const iframes =
      frames.concat(await this.client.$$(this.iframeSelector())) || [];
    if (!iframes.length) {
      return;
    }

    for (const iframe of iframes) {
      try {
        const exists = await iframe.isExisting();
        if (!exists) {
          continue;
        }
        await this.inject(iframe);
        // After injecting into iframe (and its descendants), navigate back to
        // this level. switchFrame(null) reliably resets to the top-level context.
        // Then re-enter this frame using its BiDi context ID (WDIO v9 BiDi) or
        // its element reference (Classic WebDriver).
        //
        // We use the context ID rather than the element reference because in WDIO
        // v9 BiDi mode, Chrome may assign new document IDs to intermediate frame
        // contexts after a deep switchFrame(null). An element's SharedId encodes
        // the document ID at query time; if the document ID has since changed, the
        // SharedId is stale and Chrome rejects it with "no such node". Passing a
        // context ID string instead causes WDIO to re-query fresh element
        // references via browsingContextLocateNodes, bypassing the stale-ID issue.
        await clientSwitchFrame(this.client, null);
        if (browsingContextId !== null && 'switchFrame' in this.client) {
          // browsingContextId is only set on v9 BiDi clients, so switchFrame is available.
          await this.client.switchFrame(browsingContextId);
        } else if (browsingContext !== null) {
          await clientSwitchFrame(this.client, browsingContext);
        }
      } catch (error) {
        logOrRethrowError(error);
      }
    }
  }

  private async analyzePromise(): Promise<AxeResults> {
    const { client, axeSource } = this;
    const context = normalizeContext(
      this.includes,
      this.excludes,
      this.disableFrameSelectors
    );

    const runPartialSupported = await axeSourceInject(client, axeSource);
    if (!runPartialSupported || this.legacyMode) {
      return await this.runLegacy(context);
    }

    // ensure we fail quickly if an iframe cannot be loaded (instead of waiting
    // the default length of 30 seconds)
    const { pageLoad } = await this.client.getTimeouts();
    this.client.setTimeout({
      pageLoad: FRAME_LOAD_TIMEOUT
    });

    let partials: PartialResults | null;
    try {
      partials = await this.runPartialRecursive(context);
    } finally {
      this.client.setTimeout({
        pageLoad
      });
    }

    try {
      return await this.finishRun(partials);
    } catch (error) {
      throw new Error(
        `${(error as Error).message}\n Please check out ${this.errorUrl}`
      );
    }
  }

  private async runLegacy(context: SerialContextObject): Promise<AxeResults> {
    const { client, option } = this;
    await this.inject();
    return axeRunLegacy(client, context, option);
  }

  /**
   * Get a CSS selector for retrieving child iframes.
   */
  private iframeSelector(): string {
    let selector = 'iframe';
    for (const disableFrameSelector of this.disableFrameSelectors) {
      selector += `:not(${disableFrameSelector})`;
    }
    return selector;
  }

  /**
   * Get a CSS selector for retrieving child frames.
   */
  private frameSelector(): string {
    let selector = 'frame';
    for (const disableFrameSelector of this.disableFrameSelectors) {
      selector += `:not(${disableFrameSelector})`;
    }
    return selector;
  }

  /**
   * Get partial results from the current context and its child frames
   * @param {ContextObject} context
   */

  private async runPartialRecursive(
    context: SerialContextObject,
    frameStack: WdioElement[] = [],
    topWindow?: string
  ): Promise<PartialResults> {
    if (topWindow === undefined) {
      topWindow = await this.client.getWindowHandle();
    }
    const frameContexts = await axeGetFrameContext(this.client, context);
    const partials: PartialResults = [
      await axeRunPartial(this.client, context, this.option)
    ];

    for (const { frameSelector, frameContext } of frameContexts) {
      try {
        const frame = await this.client.$(frameSelector);
        assert(frame, `Expect frame of "${frameSelector}" to be defined`);
        await clientSwitchFrame(this.client, frame);
        await axeSourceInject(this.client, this.script);
        partials.push(
          ...(await this.runPartialRecursive(
            frameContext,
            [...frameStack, frame],
            topWindow
          ))
        );
      } catch {
        await clientSwitchWindow(this.client, topWindow);

        for (const frameElm of frameStack) {
          await clientSwitchFrame(this.client, frameElm);
        }

        partials.push(null);
      }
    }
    // Navigate back to the parent context by switching to the top-level window
    // (via getWindowHandles + switchToWindow, which correctly sets the BiDi
    // context) then re-traversing the frame stack up to (but not including)
    // the last frame. This avoids the WDIO v9 BiDi race condition where
    // switchToParentFrame synchronously resets #currentContext before the async
    // parent lookup resolves, causing subsequent BiDi calls to run in wrong context.
    await clientSwitchWindow(this.client, topWindow);
    for (let i = 0; i < frameStack.length - 1; i++) {
      await clientSwitchFrame(this.client, frameStack[i]);
    }
    return partials;
  }

  private async finishRun(partials: PartialResults): Promise<AxeResults> {
    const { client, axeSource, option } = this;
    const win = await client.getWindowHandle();
    const newWindow = await client.createWindow('tab');
    assert(
      newWindow.handle,
      'Please make sure that you have popup blockers disabled.'
    );

    try {
      await clientSwitchWindow(client, newWindow.handle);
      await client.url('data:text/html,');
    } catch (error) {
      throw new Error(
        `switchToWindow failed. Are you using updated browser drivers? \nDriver reported:\n${
          (error as Error).message
        }`
      );
    }

    const res = await axeFinishRun(client, axeSource, partials, option);
    // Cleanup
    await client.closeWindow();
    await clientSwitchWindow(client, win);

    return res;
  }
}

export { AxeBuilder };
