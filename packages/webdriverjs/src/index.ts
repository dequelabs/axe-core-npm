import { WebDriver } from 'selenium-webdriver';
import {
  RunOptions,
  Spec,
  AxeResults,
  ContextObject,
  PartialResult
} from 'axe-core';
import { source } from 'axe-core';
import { CallbackFunction, BuilderOptions } from './types';
import { normalizeContext } from './utils';
import AxeInjector from './axe-injector';
import {
  axeGetFrameContext,
  axeRunPartial,
  axeRunLegacy,
  axeSourceInject,
  axeFinishRun,
  axeSupportsRunPartial,
  FrameContextWeb
} from './browser';
import * as assert from 'assert';

type PartialResults = Array<PartialResult | null>;

class AxeBuilder {
  private driver: WebDriver;
  private axeSource: string;
  private includes: string[];
  private excludes: string[];
  private option: RunOptions;
  private config: Spec | null;
  private builderOptions: BuilderOptions;

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
  public include(selector: string): AxeBuilder {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   */
  public exclude(selector: string): AxeBuilder {
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   */
  public options(options: RunOptions): AxeBuilder {
    this.option = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
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
   * Set configuration for `axe-core`.
   * This value is passed directly to `axe.configure()`
   */
  public configure(config: Spec): AxeBuilder {
    /* istanbul ignore if */
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
    let pResults: Promise<AxeResults>;
    await this.driver.switchTo().defaultContent();
    await axeSourceInject(this.driver, this.axeSource, this.config);
    const supportsRunPartial = await axeSupportsRunPartial(this.driver);
    const context = normalizeContext(this.includes, this.excludes);

    const legacyMode = false;
    if (supportsRunPartial && !legacyMode) {
      const partials = await this.runPartialRecursive(context);
      pResults = this.finishRun(partials);
    } else {
      // Axe-core before 4.3
      pResults = this.runLegacy(context);
    }
    return this.resolveCallback(pResults, callback);
  }

  /**
   * Use axe.run() to get results from the page
   */
  private async runLegacy(context: ContextObject): Promise<AxeResults> {
    const { driver, axeSource, config, builderOptions } = this;
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
   * Use axe.runPartial() to get partial results from the page
   */
  private async runPartialRecursive(
    context: ContextObject,
    skipInjection = false
  ): Promise<PartialResults> {
    if (!skipInjection) {
      await axeSourceInject(this.driver, this.axeSource, this.config);
    }
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await axeGetFrameContext(this.driver, context);
    const partialResults: PartialResults = [
      await axeRunPartial(this.driver, context, this.option)
    ];

    for (const frameInfo of frameContexts) {
      const partials = await this.runFramePartial(frameInfo);
      partialResults.push(...partials);
    }
    return partialResults;
  }

  async runFramePartial({
    frameContext,
    frameSelector,
    frame
  }: FrameContextWeb): Promise<PartialResults> {
    let switchedFrame = false;
    try {
      assert(frame, `Expect frame of "${frameSelector}" to be defined`);
      await this.driver.switchTo().frame(frame);
      switchedFrame = true;
      const partials = await this.runPartialRecursive(frameContext);
      await this.driver.switchTo().parentFrame();
      return partials;
    } catch {
      if (switchedFrame) {
        await this.driver.switchTo().parentFrame();
      }
      return [null];
    }
  }

  /**
   * Use axe.finishRun() to turn partial results into actual results
   */
  private async finishRun(partials: PartialResults): Promise<AxeResults> {
    await this.driver.switchTo().newWindow('tab');
    await axeSourceInject(this.driver, this.axeSource, this.config);
    const res = await axeFinishRun(this.driver, partials, this.option);
    await this.driver.switchTo().defaultContent();
    return res;
  }

  /**
   * Pass the axe results, or possible to the callback if needed
   * and return a promise.
   */
  private resolveCallback(
    thenable: Promise<AxeResults>,
    callback?: CallbackFunction
  ): Promise<AxeResults> {
    return new Promise((resolve, reject) => {
      thenable
        .then((results: AxeResults) => {
          /* istanbul ignore if */
          callback?.(null, results);
          resolve(results);
        })
        .catch((err: Error) => {
          // When using a callback, do *not* reject the wrapping Promise. This prevents having to handle the same error twice.
          /* istanbul ignore else */
          if (callback) {
            callback(err.message, null);
          } else {
            reject(err);
          }
        });
    });
  }
}

exports = module.exports = AxeBuilder;

export default AxeBuilder;
