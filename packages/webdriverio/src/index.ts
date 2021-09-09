import type { RunOptions, AxeResults } from 'axe-core';
import { ContextObject } from 'axe-core';
import * as fs from 'fs';
import * as assert from 'assert';
import * as cssesc from 'cssesc';
import type {
  Options,
  CallbackFunction,
  BrowserObject,
  Element,
  PartialResults
} from './types';
import {
  isWebdriverClient,
  normalizeContext,
  logOrRethrowError,
  axeSourceInject,
  axeGetFrameContext,
  axeRunPartial,
  axeFinishRun,
  axeRunLegacy
} from './utils';

export default class AxeBuilder {
  private client: BrowserObject;
  private axeSource: string;
  private includes: string[];
  private excludes: string[];
  private option: RunOptions;
  private disableFrameSelectors: string[];
  constructor({ client, axeSource }: Options) {
    assert(
      isWebdriverClient(client),
      'An instantiated WebdriverIO client greater than v5 is required'
    );
    const sourceDir = require.resolve('axe-core');
    const source = fs.readFileSync(sourceDir, 'utf-8');
    this.client = client;
    this.axeSource = axeSource || source;
    this.includes = [];
    this.excludes = [];
    this.option = {};
    this.disableFrameSelectors = [];
  }

  /**
   * Disable injecting axe-core into frame(s) matching the
   * given CSS `selector`. This method may be called any number of times.
   * @param {String} selector
   * @returns {this}
   */

  public disableFrame(selector: string): this {
    this.disableFrameSelectors.push(cssesc(selector));
    return this;
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   * @param {String} selector
   * @returns {this}
   */

  public include(selector: string): this {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   * @param {String} selector
   * @returns {this}
   */

  public exclude(selector: string): this {
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   * @param {RunOptions} options
   * @returns {this}
   */

  public options(options: RunOptions): this {
    this.option = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
   * @param {String|Array} rules
   * @returns {this}
   */

  public withRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    /* istanbul ignore next */
    this.option = this.option || {};
    this.option.runOnly = {
      type: 'rule',
      values: rules
    };

    return this;
  }

  /**
   * Limit analysis to only specified tags.
   * Cannot be used with `AxeBuilder#withRules`
   * @param {String|Array} tags
   * @returns {this}
   */

  public withTags(tags: string | string[]): this {
    tags = Array.isArray(tags) ? tags : [tags];
    /* istanbul ignore next */
    this.option = this.option || {};
    this.option.runOnly = {
      type: 'tag',
      values: tags
    };
    return this;
  }

  /**
   * Set the list of rules to skip when running an analysis.
   * @param {String|Array} rules
   * @returns {this}
   */

  public disableRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    /* istanbul ignore next */
    this.option = this.option || {};
    this.option.rules = {};

    for (const rule of rules) {
      this.option.rules[rule] = { enabled: false };
    }

    return this;
  }

  /**
   * Performs an analysis and retrieves results.
   * @param {CallbackFunction} callback
   * @returns {Promise<AxeResults>}
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
   * @returns {String}
   */

  private get script(): string {
    return `
      ${this.axeSource}
      axe.configure({ 
        allowedOrigins: ['<unsafe_all_origins>'],
        branding: { application: 'webdriverio' }
      })
      `;
  }

  /**
   * Injects `axe-core` into all frames.
   * @param {Element | null} browsingContext - defaults to null
   * @returns {Promise<void>}
   */

  private async inject(browsingContext: Element | null = null): Promise<void> {
    await this.setBrowsingContext(browsingContext);
    await this.client.execute(this.script);

    const frames =
      (await this.client.$$(this.frameSelector())) ||
      /* istanbul ignore next */ [];
    const iframes =
      frames.concat(await this.client.$$(this.iframeSelector())) ||
      /* istanbul ignore next */ [];
    if (!iframes.length) {
      return;
    }

    for (const iframe of iframes) {
      try {
        const exist = await iframe.isExisting();
        /* istanbul ignore if */
        if (!exist) {
          continue;
        }
        await this.inject(iframe);
        await this.client.switchToParentFrame();
      } catch (error) {
        /* istanbul ignore next */
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

    const runPartialSupported = await axeSourceInject({
      client,
      axeSource
    });

    if (!runPartialSupported) {
      return await this.runLegacy(context);
    }
    const partials = await this.runPartialRecursive(context);

    return await this.finishRun(partials);
  }

  private async runLegacy(context: ContextObject): Promise<AxeResults> {
    const { client, option } = this;
    await this.inject();
    return axeRunLegacy({ client, context, options: option });
  }

  /**
   * Get a CSS selector for retrieving child iframes.
   * @returns {String}
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
   * @returns {String}
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
   * @param {null | Element | BrowserObject} id - defaults to null
   * @returns {Promise<void>}
   */

  private async setBrowsingContext(
    id: null | Element | BrowserObject = null
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
    context: ContextObject
  ): Promise<PartialResults> {
    const frameContexts = await axeGetFrameContext({
      client: this.client,
      context
    });

    const partials: PartialResults = [
      await axeRunPartial({
        client: this.client,
        context,
        options: this.option
      })
    ];

    for (const { frameSelector, frameContext, frame } of frameContexts) {
      try {
        assert(frame, `Expect frame of "${frameSelector}" to be defined`);
        await this.client.switchToFrame(frame);
        await axeSourceInject({
          client: this.client,
          axeSource: this.script
        });
        partials.push(...(await this.runPartialRecursive(frameContext)));
      } catch (error) {
        partials.push(null);
      }
    }
    await this.client.switchToParentFrame();
    return partials;
  }

  private async finishRun(partials: PartialResults): Promise<AxeResults> {
    const { client, axeSource, option } = this;
    const newWindow = await client.createWindow('tab');
    await client.switchToWindow(newWindow.handle);
    await client.url('about:blank');
    const res = await axeFinishRun({
      client,
      axeSource,
      options: option,
      partialResults: partials
    });
    await client.closeWindow();

    return res;
  }
}
