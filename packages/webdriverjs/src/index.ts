import type { WebDriver } from 'selenium-webdriver';
import type { RunOptions, Spec, AxeResults, ContextObject } from 'axe-core';
import { source } from 'axe-core';
import type { CallbackFunction, BuilderOptions } from './types';
import { normalizeContext } from './utils';
import {
  axeGetFrameContext,
  axeRunPartial,
  axeRunLegacy,
  axeSourceInject,
  axeFinishRun
} from './browser';
import AxeInjector from './axe-injector';
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
   * Set configuration for `axe-core`.
   * This value is passed directly to `axe.configure()`
   * @param {Spec} config
   * @returns {AxeBuilder | Error}
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
   * @param {CallbackFunction} callback
   * @returns {Promise<AxeResults>}
   */

  public async analyze(callback?: CallbackFunction): Promise<AxeResults> {
    const driver = this.driver;
    const context = normalizeContext(this.includes, this.excludes);
    const options = this.option;
    const config = this.config;
    const axeSource = this.axeSource;
    const injector = new AxeInjector({
      driver,
      axeSource,
      config,
      builderOptions: this.builderOptions
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
  ): Promise<string[]> {
    if (!initiator) {
      await axeSourceInject(this.driver, this.axeSource, this.config);
    }
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await axeGetFrameContext(this.driver, context);
    const partials: string[] = [
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
