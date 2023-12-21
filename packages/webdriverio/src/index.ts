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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { createRequire } = (await import('node:module')) as any;
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
      } catch (e) {
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
    browsingContext: WdioElement | null = null
  ): Promise<void> {
    await this.setBrowsingContext(browsingContext);
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
        if (!(await iframe.isExisting())) {
          continue;
        }
        await this.inject(iframe);
        await this.client.switchToParentFrame();
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
    (this.client as WebdriverIO.Browser).setTimeout({
      pageLoad: FRAME_LOAD_TIMEOUT
    });

    let partials: PartialResults | null;
    try {
      partials = await this.runPartialRecursive(context);
    } finally {
      (this.client as WebdriverIO.Browser).setTimeout({
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
   * Set browsing context - when `null` sets top level page as context
   * - https://webdriver.io/docs/api/webdriver.html#switchtoframe
   */
  private async setBrowsingContext(
    id: null | WdioElement | WdioBrowser = null
  ): Promise<void> {
    if (id) {
      await this.client.switchToFrame(id);
    } else {
      await this.client.switchToParentFrame();
    }
  }

  /**
   * Get partial results from the current context and its child frames
   * @param {ContextObject} context
   */

  private async runPartialRecursive(
    context: SerialContextObject,
    frameStack: WdioElement[] = []
  ): Promise<PartialResults> {
    const frameContexts = await axeGetFrameContext(this.client, context);
    const partials: PartialResults = [
      await axeRunPartial(this.client, context, this.option)
    ];

    for (const { frameSelector, frameContext } of frameContexts) {
      try {
        const frame = await this.client.$(frameSelector);
        assert(frame, `Expect frame of "${frameSelector}" to be defined`);
        await this.client.switchToFrame(frame);
        await axeSourceInject(this.client, this.script);
        partials.push(
          ...(await this.runPartialRecursive(frameContext, [
            ...frameStack,
            frame
          ]))
        );
      } catch (error) {
        const [topWindow] = await this.client.getWindowHandles();
        await this.client.switchToWindow(topWindow);

        for (const frameElm of frameStack) {
          await this.client.switchToFrame(frameElm);
        }

        partials.push(null);
      }
    }
    await this.client.switchToParentFrame();
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
      await client.switchToWindow(newWindow.handle);
      await (client as WebdriverIO.Browser).url('about:blank');
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
    await client.switchToWindow(win);

    return res;
  }
}

export { AxeBuilder };
