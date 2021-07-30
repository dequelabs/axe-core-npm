import { WebDriver } from 'selenium-webdriver';
import { RunOptions, Spec, AxeResults, ContextObject } from 'axe-core';
import { source } from 'axe-core';
import { CallbackFunction, BuilderOptions } from './types';
import { normalizeContext, sleep } from './utils';
import AxeInjector from './axe-injector';
import { AxePartialRunner, PartialResults } from './axe-partial-runner';
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
    return new Promise((resolve, reject) => {
      return this.analyzePromise()
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

  /**
   * Analyzes the page, returning a promise
   */
  private async analyzePromise(): Promise<AxeResults> {
    const context = normalizeContext(this.includes, this.excludes);
    await this.driver.switchTo().defaultContent();
    await axeSourceInject(this.driver, this.axeSource, this.config);

    if ((await axeSupportsRunPartial(this.driver)) === false) {
      return this.runLegacy(context);
    }

    const partialRunner = await this.runPartialRecursive(context);
    const partials = await partialRunner.getPartials();
    return this.finishRun(partials);
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
   * Get partial results from the current context and its child frames
   */
  private async runPartialRecursive(
    context: ContextObject
  ): Promise<AxePartialRunner> {
    await axeSourceInject(this.driver, this.axeSource, this.config);
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await axeGetFrameContext(this.driver, context);
    // axeRunPartial MUST NOT be awaited, its promise is passed to AxePartialRunner
    const partialPromise = axeRunPartial(this.driver, context, this.option);
    const runner = new AxePartialRunner(partialPromise);

    for (const frameInfo of frameContexts) {
      const childResult = await this.runFramePartial(frameInfo);
      runner.addChildResults(childResult);
    }
    return runner;
  }

  /**
   * Get partial results from a specific frame
   */
  async runFramePartial({
    frameContext,
    frameSelector,
    frame
  }: FrameContextWeb): Promise<AxePartialRunner | null> {
    let switchedFrame = false;
    try {
      assert(frame, `Expect frame of "${frameSelector}" to be defined`);
      await this.driver.switchTo().frame(frame);
      switchedFrame = true;
      const partialRunner = await this.runPartialRecursive(frameContext);
      await sleep(); // Wait a tick for axe.runPartial to start
      await this.driver.switchTo().parentFrame();

      return partialRunner;
    } catch {
      if (switchedFrame) {
        await this.driver.switchTo().parentFrame();
      }
      return null;
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
}

exports = module.exports = AxeBuilder;

export default AxeBuilder;
