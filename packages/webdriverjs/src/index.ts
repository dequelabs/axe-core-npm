import type { WebDriver } from 'selenium-webdriver';
import type { RunOptions, Spec, AxeResults } from 'axe-core';
import { source } from 'axe-core';
import type { CallbackFunction, BuilderOptions } from './types';
import { normalizeContext } from './utils';
import AxeInjector from './axe-injector';

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

    return new Promise((resolve, reject) => {
      injector.inject(() => {
        driver
          // https://github.com/vercel/pkg/issues/676
          // we need to pass a string vs a function so we manually stringified the function
          .executeAsyncScript(
            `
          const callback = arguments[arguments.length - 1];
          const context = ${JSON.stringify(context)} || document;
          const options = ${JSON.stringify(options)} || {};
          const config = ${JSON.stringify(config)} || null;
          if (config) {
            window.axe.configure(config);
          }
          window.axe.run(context, options).then(callback);
        `
          )
          .then(results => {
            /* istanbul ignore if */
            if (callback) {
              callback(null, results as AxeResults);
            }
            resolve(results as AxeResults);
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
    });
  }
}

exports = module.exports = AxeBuilder;

// Enable ESM/TS imports while we wait for a SEMVER major release.
export { AxeBuilder as default };
