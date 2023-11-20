import type { WebDriver, WebElement } from 'selenium-webdriver';
import axe, {
  RunOptions,
  Spec,
  AxeResults,
  SerialContextObject,
  SerialSelectorList,
  SerialFrameSelector
} from 'axe-core';
const { source } = axe;
import { CallbackFunction, BuilderOptions } from './types';
import { normalizeContext } from './utils/index';
import AxeInjector from './axe-injector';
import {
  axeGetFrameContext,
  axeRunPartial,
  axeRunLegacy,
  axeSourceInject,
  axeFinishRun
} from './browser';
import assert from 'assert';

export default class AxeBuilder {
  private driver: WebDriver;
  private axeSource: string;
  private includes: SerialSelectorList;
  private excludes: SerialSelectorList;
  private option: RunOptions;
  private config: Spec | null;
  private builderOptions: BuilderOptions;
  private legacyMode = false;
  private errorUrl: string;

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
    this.errorUrl =
      'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/webdriverjs/error-handling.md';
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
            callback(err, null);
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
  public setLegacyMode(legacyMode = true): this {
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

    // ensure we fail quickly if an iframe cannot be loaded (instead of waiting
    // the default length of 30 seconds)
    const { pageLoad } = await this.driver.manage().getTimeouts();
    this.driver.manage().setTimeouts({ pageLoad: 1000 });

    let partials: string[];
    try {
      partials = await this.runPartialRecursive(context);
    } finally {
      this.driver.manage().setTimeouts({ pageLoad });
    }

    try {
      return await this.finishRun(partials);
    } catch (error) {
      throw new Error(
        `${(error as Error).message}\n Please check out ${this.errorUrl}`
      );
    }
  }

  /**
   * Use axe.run() to get results from the page
   */
  private async runLegacy(context: SerialContextObject): Promise<AxeResults> {
    const { driver, axeSource, builderOptions } = this;
    let config = this.config;
    if (!this.legacyMode) {
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
    context: SerialContextObject,
    frameStack: WebElement[] = []
  ): Promise<string[]> {
    if (frameStack.length) {
      await axeSourceInject(this.driver, this.axeSource, this.config);
    }
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await axeGetFrameContext(this.driver, context);
    const partials: string[] = [
      await axeRunPartial(this.driver, context, this.option)
    ];

    for (const { frameContext, frameSelector, frame } of frameContexts) {
      try {
        assert(frame, `Expect frame of "${frameSelector}" to be defined`);
        await this.driver.switchTo().frame(frame);
        partials.push(
          ...(await this.runPartialRecursive(frameContext, [
            ...frameStack,
            frame
          ]))
        );
        await this.driver.switchTo().parentFrame();
      } catch {
        /*
          When switchTo().frame() fails using chromedriver (but not geckodriver)
          it puts the driver into a really bad state that is impossible to
          recover from. So we need to switch back to the main window and then
          go back to the desired iframe context
        */
        const win = await this.driver.getWindowHandle();
        await this.driver.switchTo().window(win);

        for (const frameElm of frameStack) {
          await this.driver.switchTo().frame(frameElm);
        }

        partials.push('null');
      }
    }
    return partials;
  }

  /**
   * Use axe.finishRun() to turn partial results into actual results
   */
  private async finishRun(partials: string[]): Promise<AxeResults> {
    const { driver, axeSource, config, option } = this;

    const win = await driver.getWindowHandle();
    await driver.switchTo().window(win);

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

// ensure backwards compatibility with commonJs default export
if (typeof module === 'object') {
  module.exports = AxeBuilder;
  module.exports.default = AxeBuilder;
  module.exports.AxeBuilder = AxeBuilder;
}

export { AxeBuilder };
