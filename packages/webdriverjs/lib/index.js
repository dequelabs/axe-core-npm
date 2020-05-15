var deprecate = require('depd')('axe-webdriverjs');
var AxeInjector = require('./axe-injector');
var normalizeContext = require('./normalize-context');

/**
 * Constructor for chainable WebDriver API
 * @param {WebDriver} driver WebDriver instance to analyze
 */
function AxeBuilder(driver, source, builderOptions = {}) {
  if (!(this instanceof AxeBuilder)) {
    return new AxeBuilder(driver, source);
  }

  this._driver = driver;
  this._source = source || null;
  this._includes = [];
  this._excludes = [];
  this._options = null;
  this._config = null;
  this._builderOptions = builderOptions;
}

/**
 * Selector to include in analysis
 * @param  {String} selector CSS selector of the element to include
 * @return {AxeBuilder}
 */
AxeBuilder.prototype.include = function(selector) {
  this._includes.push(Array.isArray(selector) ? selector : [selector]);
  return this;
};

/**
 * Selector to exclude in analysis
 * @param  {String} selector CSS selector of the element to exclude
 * @return {AxeBuilder}
 */
AxeBuilder.prototype.exclude = function(selector) {
  this._excludes.push(Array.isArray(selector) ? selector : [selector]);
  return this;
};

/**
 * Options to directly pass to `axe.run`.  See API documentation for axe-core for use.  Will override any other configured options, including calls to `withRules` and `withTags`.
 * @param  {Object} options Options object
 * @return {AxeBuilder}
 */
AxeBuilder.prototype.options = function(options) {
  this._options = options;
  return this;
};

/**
 * Limit analysis to only the specified rules.  Cannot be used with `withTags`.
 * @param {Array|String} rules Array of rule IDs, or a single rule ID as a string
 * @return {AxeBuilder}
 */
AxeBuilder.prototype.withRules = function(rules) {
  rules = Array.isArray(rules) ? rules : [rules];
  this._options = this._options || {};
  this._options.runOnly = {
    type: 'rule',
    values: rules
  };

  return this;
};

/**
 * Limit analysis to only the specified tags.  Cannot be used with `withRules`.
 * @param {Array|String} rules Array of tags, or a single tag as a string
 * @return {AxeBuilder}
 */
AxeBuilder.prototype.withTags = function(tags) {
  tags = Array.isArray(tags) ? tags : [tags];
  this._options = this._options || {};
  this._options.runOnly = {
    type: 'tag',
    values: tags
  };

  return this;
};

/**
 * Set the list of rules to skip when running an analysis
 * @param {Array|String} rules Array of rule IDs, or a single rule ID as a string
 * @return {AxeBuilder}
 */
AxeBuilder.prototype.disableRules = function(rules) {
  rules = Array.isArray(rules) ? rules : [rules];
  this._options = this._options || {};
  this._options.rules = {};

  rules.forEach(
    function(rulesConfiguration, ruleToDisable) {
      rulesConfiguration[ruleToDisable] = {
        enabled: false
      };
    }.bind(null, this._options.rules)
  );

  return this;
};

/**
 * Configure aXe before running analyze. *Does not chain.*
 * @param  {Object} config Configuration object to use in analysis
 */
AxeBuilder.prototype.configure = function(config) {
  if (typeof config !== 'object') {
    throw new Error(
      'AxeBuilder needs an object to configure. See axe-core configure API.'
    );
  }

  this._config = config;
  return this;
};

/**
 * Perform analysis and retrieve results. *Does not chain.*
 *
 * If a `callback` is provided, it is strongly recommended that it accepts two arguments: `error, results`. If only a single argument is accepted, a deprecation warning will be printed to `stderr` and any errors encoutered during analysis will crash the Node process.
 *
 * @param  {Function} [callback] Function to execute when analysis completes
 * @return {Promise}
 */
AxeBuilder.prototype.analyze = function(callback) {
  var context = normalizeContext(this._includes, this._excludes),
    driver = this._driver,
    options = this._options,
    config = this._config,
    source = this._source;

  // Check if the provided `callback` uses the old argument signature (an arity of 1). If it does, provide a helpful deprecation warning.
  var isOldAPI = callback && callback.length === 1;
  if (isOldAPI) {
    deprecate(
      'Error must be handled as the first argument of axe.analyze. See: #83'
    );
  }

  return new Promise((resolve, reject) => {
    var injector = new AxeInjector({
      driver,
      axeSource: source,
      config,
      options: this._builderOptions
    });
    injector.inject(() => {
      driver
        .executeAsyncScript(
          function(context, options, config) {
            /* eslint-env browser */
            if (config !== null) {
              window.axe.configure(config);
            }
            window.axe
              .run(context || document, options || {})
              .then(arguments[arguments.length - 1]);
          },
          context,
          options,
          config
        )
        .then(function(results) {
          if (callback) {
            // If using the old API, provide the `results` as the first and only argument. Otherwise, provide `null` indicating no errors were encountered.
            if (isOldAPI) {
              callback(results);
            } else {
              callback(null, results);
            }
          }
          resolve(results);
        })
        .catch(err => {
          // When using a callback, do *not* reject the wrapping Promise. This prevents having to handle the same error twice.
          if (callback) {
            // If using the old API, throw this error (and unfortunately crash the process), since there is no way to handle it. Otherwise, provide the error as the first argument ("error-back" style).
            if (isOldAPI) {
              throw err;
            } else {
              callback(err, null);
            }
          } else {
            reject(err);
          }
        });
    });
  });
};

exports = module.exports = AxeBuilder;

// TypeScript/ES6 module support (see #74).
exports.default = AxeBuilder;
