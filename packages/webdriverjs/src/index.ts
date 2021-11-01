import { WebDriver } from 'selenium-webdriver';
import { RunOptions, Spec, AxeResults, ContextObject } from 'axe-core';
import { source } from 'axe-core';
import { CallbackFunction, BuilderOptions, PartialResults } from './types';
import { normalizeContext } from './utils/index';
import AxeInjector from './axe-injector';
import {
  axeGetFrameContext,
  axeRunPartial,
  axeRunLegacy,
  axeSourceInject,
  axeFinishRun
} from './browser';
import * as assert from 'assert';

class AxeBuilder {
  private driver: WebDriver;
  private axeSource: string;
  private includes: string[];
  private excludes: string[];
  private option: RunOptions;
  private config: Spec | null;
  private builderOptions: BuilderOptions;
  private legacyMode = false;

  constructor(
    driver: WebDriver,
    axeSource?: string | null,
    builderOptions?: BuilderOptions
  ) {
    this.driver = driver;
    this.axeSource = axeSource || source;
    this.includes = [];
    this.excludes = [];
    this.option = {};
    this.config = null;
    this.builderOptions = builderOptions || {};
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   */
  public include(selector: string): this {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   */
  public exclude(selector: string): this {
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
   * Set configuration for `axe-core`.
   * This value is passed directly to `axe.configure()`
   */
  public configure(config: Spec): this {
    if (typeof config !== 'object') {
      throw new Error(
        'AxeBuilder needs an object to configure. See axe-core configure API.'
      );
    }
    this.config = config;
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
   * Use frameMessenger with <same_origin_only>
   *
   * This disables use of axe.runPartial() which is called in each frame, and
   * axe.finishRun() which is called in a blank page. This uses axe.run() instead,
   * but with the restriction that cross-origin frames will not be tested.
   */
  public setLegacyMode(legacyMode = true): AxeBuilder {
    this.legacyMode = legacyMode;
    return this;
  }

  /**
   * Analyzes the page, returning a promise
   */
  private async analyzePromise(): Promise<AxeResults> {
    const context = normalizeContext(this.includes, this.excludes);
    await this.driver.switchTo().defaultContent();
    const { runPartialSupported } = await axeSourceInject(
      this.driver,
      this.axeSource,
      this.config
    );
    if (runPartialSupported !== true || this.legacyMode) {
      return this.runLegacy(context);
    }

    const partials = await this.runPartialRecursive(context, true);

    try {
      return await this.finishRun(partials);
    } catch (error) {
      throw new Error(
        `${
          (error as any).message
        }\n Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverjs/error-handling.md`
      );
    }
  }

  /**
   * Use axe.run() to get results from the page
   */
  private async runLegacy(context: ContextObject): Promise<AxeResults> {
    const { driver, axeSource, builderOptions } = this;
    let config = this.config;
    if (this.legacyMode !== true) {
      config = {
        ...(config || {}),
        allowedOrigins: ['<unsafe_all_origins>']
      };
    }
    const injector = new AxeInjector({
      driver,
      axeSource,
      config,
      builderOptions
    });
    await injector.injectIntoAllFrames();
    return axeRunLegacy(this.driver, context, this.option, this.config);
  }

  /**
   * Get partial results from the current context and its child frames
   */
  private async runPartialRecursive(
    context: ContextObject,
    initiator = false
  ): Promise<PartialResults> {
    if (!initiator) {
      await axeSourceInject(this.driver, this.axeSource, this.config);
    }
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await axeGetFrameContext(this.driver, context);
    const partials: PartialResults = [
      await axeRunPartial(this.driver, context, this.option)
    ];

    for (const { frameContext, frameSelector, frame } of frameContexts) {
      let switchedFrame = false;
      try {
        assert(frame, `Expect frame of "${frameSelector}" to be defined`);
        await this.driver.switchTo().frame(frame);
        switchedFrame = true;
        partials.push(...(await this.runPartialRecursive(frameContext)));
        await this.driver.switchTo().parentFrame();
      } catch {
        if (switchedFrame) {
          await this.driver.switchTo().parentFrame();
        }
        partials.push(null);
      }
    }
    return partials;
  }

  /**
   * Use axe.finishRun() to turn partial results into actual results
   */
  private async finishRun(partials: PartialResults): Promise<AxeResults> {
    const { driver, axeSource, config, option } = this;

    const win = await driver.getWindowHandle();

    try {
      await driver.executeScript(`window.open('about:blank')`);
      const handlers = await driver.getAllWindowHandles();
      await driver.switchTo().window(handlers[handlers.length - 1]);
      await driver.get('about:blank');
    } catch (error) {
      throw new Error(
        `switchTo failed. Are you using updated browser drivers? \nDriver reported:\n${error}`
      );
    }
    // Make sure we're on a blank page, even if window.open isn't functioning properly.
    const res = await axeFinishRun(driver, axeSource, config, partials, option);
    await driver.close();
    await driver.switchTo().window(win);
    return res;
  }
}

exports = module.exports = AxeBuilder;

export default AxeBuilder;
