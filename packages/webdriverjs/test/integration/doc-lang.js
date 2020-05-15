var runWebdriver = require('../run-webdriver');
var assert = require('chai').assert;
var host = 'localhost';
var AxeBuilder = require('../../lib');
var path = require('path');
var { createServer } = require('http-server');

if (process.env.REMOTE_TESTSERVER_HOST) {
  host = process.env.REMOTE_TESTSERVER_HOST;
}

describe('doc-lang.html', function() {
  this.timeout(10000);

  var driver;
  var server;
  before(function(done) {
    driver = runWebdriver();

    server = createServer({
      root: path.resolve(__dirname, '../..'),
      cache: -1
    });
    server.listen(9876, err => {
      if (err) {
        return done(err);
      }
      driver
        .get('http://' + host + ':9876/test/fixtures/doc-lang.html')
        .then(function() {
          done();
        });
    });
  });

  after(function(done) {
    server.close();
    driver.quit().then(function() {
      done();
    });
  });

  it('should find violations', function(done) {
    AxeBuilder(driver)
      .withRules('html-has-lang')
      .analyze()
      .then(function(results) {
        assert.lengthOf(results.violations, 1);
        assert.equal(results.violations[0].id, 'html-has-lang');
        assert.lengthOf(results.passes, 0);
        done();
      });
  });

  it('should not find violations when given context (document level rule)', function(done) {
    AxeBuilder(driver)
      .include('body')
      .withRules('html-has-lang')
      .analyze()
      .then(function(results) {
        assert.lengthOf(results.violations, 0);
        assert.lengthOf(results.passes, 0);
        done();
      });
  });

  it('should not find violations when the rule is disabled', function(done) {
    AxeBuilder(driver)
      .options({ rules: { 'html-has-lang': { enabled: false } } })
      .analyze()
      .then(function(results) {
        results.violations.forEach(function(violation) {
          assert.notEqual(violation.id, 'html-has-lang');
        });
        results.passes.forEach(function(violation) {
          assert.notEqual(violation.id, 'html-has-lang');
        });
        done();
      });
  });
});
