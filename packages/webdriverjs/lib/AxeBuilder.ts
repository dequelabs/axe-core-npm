import { WebDriver } from 'selenium-webdriver';
import {
  Spec as AxeConfig,
  RunOnly,
  AxeResults,
  ContextObject as AxeContext
} from 'axe-core';
import AxeInjector, { Options as AxeInjectorOptions } from './AxeInjector';
import normalizeContext from './normalizeContext';

type Callback = (err: Error | null, results: AxeResults | null) => void;

interface Options {
  runOnly?: RunOnly;
  rules?: {
    [id: string]: {
      enabled?: boolean;
    };
  };
}

/**
 * Constructor for chainable WebDriver API
 */

class AxeBuilder {
  private _driver: WebDriver;
  private _source: string | null;
  private _builderOptions: AxeInjectorOptions;
  private _includes: string[][] = [];
  private _excludes: string[][] = [];
  private _options: Options = {};
  private _config: AxeConfig = {};

  constructor(
    driver: WebDriver,
    source?: string,
    builderOptions: AxeInjectorOptions = {}
  ) {
    this._driver = driver;
    this._source = source || null;
    this._builderOptions = builderOptions;
  }

  /**
   * Selector to include in analysis
   * @param  {String} selector CSS selector of the element to include
   * @return {AxeBuilder}
   */

  public include(selector: string | string[]): this {
    this._includes.push(Array.isArray(selector) ? selector : [selector]);
    return this;
  }

  /**
   * Selector to exclude in analysis
   * @param  {String} selector CSS selector of the element to exclude
   * @return {AxeBuilder}
   */

  public exclude(selector: string | string[]): this {
    this._excludes.push(Array.isArray(selector) ? selector : [selector]);
    return this;
  }

  /**
   * Options to directly pass to `axe.run`.  See API documentation for axe-core for use.  Will override any other configured options, including calls to `withRules` and `withTags`.
   * @param  {Object} options Options object
   * @return {AxeBuilder}
   */

  public options(options: Options): this {
    this._options = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.  Cannot be used with `withTags`.
   * @param {Array|String} rules Array of rule IDs, or a single rule ID as a string
   * @return {AxeBuilder}
   */

  public withRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    this._options.runOnly = {
      type: 'rule',
      values: rules
    };
    return this;
  }

  /**
   * Limit analysis to only the specified tags.  Cannot be used with `withRules`.
   * @param {Array|String} rules Array of tags, or a single tag as a string
   * @return {AxeBuilder}
   */

  public withTags(tags: string | string[]): this {
    tags = Array.isArray(tags) ? tags : [tags];
    this._options.runOnly = {
      type: 'tag',
      values: tags
    };
    return this;
  }

  /**
   * Set the list of rules to skip when running an analysis
   * @param {Array|String} rules Array of rule IDs, or a single rule ID as a string
   * @return {AxeBuilder}
   */

  public disableRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    this._options.rules = {};

    for (const ruleId of rules) {
      this._options.rules[ruleId] = { enabled: false };
    }

    return this;
  }

  /**
   * Configure axe before running analyze. *Does not chain.*
   * @param  {Object} config Configuration object to use in analysis
   */

  public configure(config: AxeConfig): this {
    if (typeof config !== 'object') {
      throw new Error(
        'AxeBuilder needs an object to configure. See axe-core configure API.'
      );
    }
    this._config = config;
    return this;
  }

  /**
   * Perform analysis and retrieve results. *Does not chain.*
   *
   * If a `callback` is provided, it is strongly recommended that it accepts two arguments: `error, results`. If only a single argument is accepted, a deprecation warning will be printed to `stderr` and any errors encoutered during analysis will crash the Node process.
   *
   * @param  {Function} [callback] Function to execute when analysis completes
   * @return {Promise}
   */

  public analyze(callback: Callback): Promise<AxeResults> {
    const context = normalizeContext(this._includes, this._excludes);
    const driver = this._driver;
    const options = this._options;
    const config = this._config;
    const source = this._source;

    return new Promise((resolve, reject) => {
      const injector = new AxeInjector({
        driver,
        axeSource: source,
        config,
        options: this._builderOptions
      });

      injector.inject(() => {
        driver
          .executeAsyncScript(
            function (
              context: AxeContext,
              options: Options,
              config: AxeConfig
            ) {
              // TODO: add types
              const axe = (window as any).axe;

              /* eslint-env browser */
              if (config !== null) {
                axe.configure(config);
              }

              axe
                .run(context || document, options || {})
                // eslint-disable-next-line prefer-rest-params
                .then(arguments[arguments.length - 1]);
            },
            context,
            options,
            config
          )
          .then(results => {
            if (callback) {
              callback(null, results as AxeResults);
            }
            resolve(results as AxeResults);
          })
          .catch(err => {
            // When using a callback, do *not* reject the wrapping Promise. This prevents having to handle the same error twice.
            if (callback) {
              callback(err, null);
            } else {
              reject(err);
            }
          });
      });
    });
  }
}

export default AxeBuilder;
