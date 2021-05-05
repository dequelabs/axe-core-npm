import type { RunOptions, AxeResults } from 'axe-core';
import { source } from 'axe-core';
import * as assert from 'assert';
import * as cssesc from 'cssesc';
import type {
  Options,
  CallbackFunction,
  BrowserObject,
  Element
} from './types';
import {
  analyzePage,
  isWebdriverClient,
  normalizeContext,
  logOrRethrowError
} from './utils';

export default class AxeBuilder {
  private client: BrowserObject;
  private axeSource: string;
  private includes: string[];
  private excludes: string[];
  private option: RunOptions;
  private disableFrameSelectors: string[];
  constructor({ client }: Options) {
    assert(
      isWebdriverClient(client),
      'An instantiated WebdriverIO client greater than v5 is required'
    );
    this.client = client;
    this.axeSource = source;
    this.includes = [];
    this.excludes = [];
    this.option = {};
    this.disableFrameSelectors = [];
  }

  /**
   * Disable injecting axe-core into frame(s) matching the
   * given CSS `selector`. This method may be called any number of times.
   * @param {String} selector
   * @returns {AxeBuilder}
   */

  public disableFrame(selector: string): AxeBuilder {
    this.disableFrameSelectors.push(cssesc(selector));
    return this;
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   * @param {String} selector
   * @returns {AxeBuilder}
   */

  public include(selector: string): AxeBuilder {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   * @param {String} selector
   * @returns {AxeBuilder}
   */

  public exclude(selector: string): AxeBuilder {
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   * @param {RunOptions} options
   * @returns {AxeBuilder}
   */

  public options(options: RunOptions): AxeBuilder {
    this.option = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
   * @param {String|Array} rules
   * @returns {AxeBuilder}
   */

  public withRules(rules: string | string[]): AxeBuilder {
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
   * @returns {AxeBuilder}
   */

  public withTags(tags: string | string[]): AxeBuilder {
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
   * @returns {AxeBuilder}
   */

  public disableRules(rules: string | string[]): AxeBuilder {
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
    await this.inject();
    await this.setBrowsingContext();
    const client = this.client;
    const context = normalizeContext(this.includes, this.excludes);
    const options = this.option;

    // Ignoring since `analyzePage()` is expecting a callback()
    // and we do not need to pass one
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const { results, error } = await client.executeAsync(analyzePage, {
      context,
      options
    });
    /* istanbul ignore if */
    if (callback) {
      callback(error, results);
    }

    /* istanbul ignore if */
    if (error) {
      throw new Error(error);
    }
    return results;
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
}
