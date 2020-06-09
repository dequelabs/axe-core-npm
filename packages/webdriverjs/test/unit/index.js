const assert = require('chai').assert;
const proxyquire = require('proxyquire');
const Builder = require('../../lib/index');

describe('Builder', function () {
  describe('constructor', function () {
    it('should assign driver to this._driver', function () {
      assert.equal(new Builder('bob')._driver, 'bob');
    });

    it('should define this._includes as an empty array', function () {
      const includes = new Builder('bob')._includes;
      assert.isArray(includes);
      assert.lengthOf(includes, 0);
    });

    it('should define this._excludes as an empty array', function () {
      const excludes = new Builder('bob')._excludes;
      assert.isArray(excludes);
      assert.lengthOf(excludes, 0);
    });

    it('should define this._options as null', function () {
      assert.isNull(new Builder()._options);
    });

    it('should define this._config as null', function () {
      assert.isNull(new Builder()._config);
    });

    // https://github.com/dequelabs/html-team-proposals/pull/149
    it('should not work when instantiated without `new`', function () {
      assert.throws(() => Builder());
    });
  });

  describe('include', function () {
    it('should push onto _includes', function () {
      const builder = new Builder();
      builder.include('.bob');
      assert.lengthOf(builder._includes, 1);
      assert.lengthOf(builder._includes[0], 1);
      assert.equal(builder._includes[0][0], '.bob');
    });

    it('should return itself', function () {
      assert.instanceOf(new Builder().include('.bob'), Builder);
    });
  });

  describe('exclude', function () {
    it('should push onto _excludes', function () {
      const builder = new Builder();
      builder.exclude('.bob');
      assert.lengthOf(builder._excludes, 1);
      assert.lengthOf(builder._excludes[0], 1);
      assert.equal(builder._excludes[0][0], '.bob');
    });

    it('should return itself', function () {
      assert.instanceOf(new Builder().exclude('.bob'), Builder);
    });
  });

  describe('options', function () {
    it('should clobber _options with provided parameter', function () {
      const builder = new Builder();
      builder.options('bob');
      assert.equal(builder._options, 'bob');
      builder.options('fred');
      assert.equal(builder._options, 'fred');
    });

    it('should return itself', function () {
      assert.instanceOf(new Builder().options('bob'), Builder);
    });
  });

  describe('disableRules', function () {
    it('should properly populate _options.rules with the provided parameter', function () {
      const builder = new Builder();
      const colorRule = 'color-contrast';
      const landmarkRule = 'landmark';
      let expectedInternalState = {};

      builder.disableRules(colorRule);
      expectedInternalState[colorRule] = {
        enabled: false
      };
      assert.deepEqual(builder._options.rules, expectedInternalState);

      builder.disableRules([colorRule, landmarkRule]);
      expectedInternalState[landmarkRule] = {
        enabled: false
      };
      assert.deepEqual(builder._options.rules, expectedInternalState);

      builder.disableRules(colorRule);
      expectedInternalState = {
        'color-contrast': {
          enabled: false
        }
      };
      assert.deepEqual(builder._options.rules, expectedInternalState);
    });

    it('should return itself', function () {
      assert.instanceOf(new Builder().disableRules('color-contrast'), Builder);
    });
  });

  describe('configure', function () {
    it('should take a config object to customize aXe', function (done) {
      const catsConfig = {
        checks: {
          id: 'cats',
          options: ['cats'],
          evaluate:
            'function (node, options) {\n        var lang = (node.getAttribute("lang") || "").trim().toLowerCase();\n        var xmlLang = (node.getAttribute("xml:lang") || "").trim().toLowerCase();\n        var invalid = [];\n        (options || []).forEach(function(cc) {\n          cc = cc.toLowerCase();\n          if (lang && (lang === cc || lang.indexOf(cc.toLowerCase() + "-") === 0)) {\n            lang = null;\n          }\n          if (xmlLang && (xmlLang === cc || xmlLang.indexOf(cc.toLowerCase() + "-") === 0)) {\n            xmlLang = null;\n          }\n        });\n        if (xmlLang) {\n          invalid.push(\'xml:lang="\' + xmlLang + \'"\');\n        }\n        if (lang) {\n          invalid.push(\'lang="\' + lang + \'"\');\n        }\n        if (invalid.length) {\n          this.data(invalid);\n          return true;\n        }\n        return false;\n      }',
          metadata: {
            impact: 'critical',
            messages: {
              pass: 'The lang attribute is cats',
              fail: 'The lang attribute can only be cats'
            }
          }
        },
        rules: {
          id: 'cats',
          enabled: true,
          selector: 'html',
          any: ['cats'],
          metadata: {
            description: 'Ensures lang attributes have the value of cats',
            help: 'lang attribute must have the value of cats',
            helpUrl: 'https://example.com/cats'
          }
        }
      };
      const Builder = proxyquire('../../lib/index', {
        './axe-injector': function () {
          return { inject: cb => cb(null, 'source-code') };
        }
      });

      new Builder({
        executeAsyncScript: function (callback, context, options, config) {
          assert.equal(config, catsConfig);

          return {
            then: function (cb) {
              cb('results');
            }
          };
        }
      })
        .configure(catsConfig)
        .analyze(function (err, results) {
          assert.isNull(err);
          assert.equal(results, 'results');
          done();
        });
    });

    it('should throw a useful error', function (done) {
      const builder = new Builder();

      assert.throws(function () {
        builder.configure('cats');
      });

      assert.throws(function () {
        builder.configure(undefined);
      });
      done();
    });
  });

  describe('analyze', function () {
    it('should normalize context', function (done) {
      let normalized = false;
      const Builder = proxyquire('../../lib/index', {
        './axe-injector': function () {
          return { inject: cb => cb(null, 'source-code') };
        },
        './normalize-context': function (include, exclude) {
          normalized = true;
          assert.deepEqual(include, [['.joe']]);
          assert.deepEqual(exclude, [['.fred'], ['.bob']]);
          return null;
        }
      });

      new Builder({
        executeAsyncScript: function () {
          return {
            then: function (cb) {
              cb(null);
            }
          };
        }
      })
        .include('.joe')
        .exclude('.fred')
        .exclude('.bob')
        .analyze()
        .then(function () {
          assert.isTrue(normalized);
          done();
        });
    });

    it('should inject into the page under test', function () {
      let called = false;
      const Builder = proxyquire('../../lib/index', {
        './axe-injector': function () {
          return {
            inject(cb) {
              called = true;
              cb(null, 'source-code');
            }
          };
        }
      });
      new Builder({ executeAsyncScript: () => Promise.resolve() }).analyze();
      assert.isTrue(called);
    });

    it('should call axe.run with given parameters', function (done) {
      const Builder = proxyquire('../../lib/index', {
        './axe-injector': function () {
          return { inject: cb => cb(null, 'source-code') };
        },
        './normalize-context': function () {
          return 'normalized';
        }
      });

      new Builder({
        executeAsyncScript: function (callback, context, options) {
          assert.equal(context, 'normalized');
          assert.deepEqual(options, { foo: 'bar' });

          return {
            then: function (cb) {
              cb('results');
            }
          };
        }
      })
        .options({ foo: 'bar' })
        .analyze(function (err, results) {
          assert.isNull(err);
          assert.equal(results, 'results');
          done();
        });
    });

    it('should pass results to .then() instead of a callback', function (done) {
      const Builder = proxyquire('../../lib/index', {
        './axe-injector': function () {
          return { inject: cb => cb(null, 'source-code') };
        }
      });

      new Builder({
        executeAsyncScript: function () {
          return {
            then: function (cb) {
              cb('results');
            }
          };
        }
      })
        .analyze()
        .then(function (results) {
          assert.equal(results, 'results');
          done();
        });
    });

    it('should execute callback before .then()', function (done) {
      const Builder = proxyquire('../../lib/index', {
        './axe-injector': function () {
          return { inject: cb => cb(null, 'source-code') };
        }
      });
      let called = false;

      new Builder({
        executeAsyncScript: function () {
          return {
            then: function (cb) {
              cb('results');
            }
          };
        }
      })
        .analyze(function (err, results) {
          assert.isNull(err);
          assert.equal(results, 'results');
          assert.equal(called, false);
          called = true;
        })
        .then(function () {
          assert.equal(called, true);
          done();
        });
    });

    describe('when no error is encountered', () => {
      let builder;

      before(() => {
        const Builder = proxyquire('../../lib/index', {
          './axe-injector': () => ({ inject: cb => cb() })
        });

        builder = new Builder({
          executeAsyncScript() {
            return Promise.resolve({ yay: 'heh' });
          }
        });
      });

      describe('and provided a callback', () => {
        it('should provide results as the second argument', done => {
          builder.analyze((err, results) => {
            assert.isNull(err);
            assert.strictEqual(results.yay, 'heh');
            done();
          });
        });
      });

      describe('without a callback', () => {
        it('should resolve with the results', done => {
          builder.analyze().then(results => {
            assert.strictEqual(results.yay, 'heh');
            done();
          });
        });
      });
    });

    describe('when an analysis error is encountered', () => {
      let builder;

      before(() => {
        const Builder = proxyquire('../../lib/index', {
          './axe-injector': () => ({ inject: cb => cb() })
        });

        builder = new Builder({
          executeAsyncScript() {
            return Promise.reject(new Error('boom!'));
          }
        });
      });

      describe('without a callback', () => {
        it('should reject the returned promise', done => {
          builder.analyze().catch(err => {
            assert.strictEqual(err.message, 'boom!');
            done();
          });
        });
      });

      describe('with a callback', () => {
        it('should provide the error as the first argument', done => {
          builder.analyze((err, results) => {
            assert.strictEqual(err.message, 'boom!');
            assert.isNull(results);
            done();
          });
        });

        describe('and a .catch()', () => {
          it('should not reject the wrapping Promise', done => {
            builder
              .analyze((err, results) => {
                assert.strictEqual(err.message, 'boom!');
                assert.isNull(results);
                done();
              })
              .catch(err => {
                assert.fail(`Rejected the promise: ${err.message}`);
              });
          });
        });
      });
    });
  });
});
