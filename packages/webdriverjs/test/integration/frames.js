const runWebdriver = require('../run-webdriver');
const assert = require('chai').assert;
let host = 'localhost';
const AxeBuilder = require('../../lib');
const path = require('path');
const { createServer } = require('http-server');

if (process.env.REMOTE_TESTSERVER_HOST) {
  host = process.env.REMOTE_TESTSERVER_HOST;
}

describe('outer-frame.html', function () {
  this.timeout(10000);

  let driver;
  let server;
  before(function (done) {
    driver = runWebdriver();
    driver.manage().timeouts().setScriptTimeout(500);

    server = createServer({
      root: path.resolve(__dirname, '../..'),
      cache: -1
    });
    server.listen(9876, err => {
      if (err) {
        return done(err);
      }
      driver
        .get('http://' + host + ':9876/test/fixtures/outer-frame.html')
        .then(function () {
          done();
        });
    });
  });

  after(function () {
    server.close();
    driver.quit();
  });

  it('should find violations', function (done) {
    new AxeBuilder(driver)
      .withRules('html-lang-valid')
      .analyze()
      .then(function (results) {
        assert.lengthOf(results.violations, 1, 'violations');
        assert.equal(results.violations[0].id, 'html-lang-valid');
        assert.lengthOf(
          results.violations[0].nodes[0].target,
          2,
          'finds the iframe <html> element'
        );

        assert.lengthOf(results.passes, 1);
        assert.equal(results.passes[0].id, 'html-lang-valid');
        assert.lengthOf(
          results.passes[0].nodes[0].target,
          1,
          'main page <html> element'
        );

        done();
      });
  });

  it('should accept options', function (done) {
    new AxeBuilder(driver)
      .include('body')
      .options({ checks: { 'valid-lang': { options: ['bobbert'] } } })
      .withRules('html-lang-valid')
      .analyze()
      .then(function (results) {
        assert.lengthOf(results.violations, 0);
        assert.lengthOf(results.passes, 1);
        done();
      });
  });

  it('should not find violations when the rule is disabled', function (done) {
    new AxeBuilder(driver)
      .options({ rules: { 'html-lang-valid': { enabled: false } } })
      .analyze()
      .then(function (results) {
        results.violations.forEach(function (violation) {
          assert.notEqual(violation.id, 'html-lang-valid');
        });
        results.passes.forEach(function (violation) {
          assert.notEqual(violation.id, 'html-lang-valid');
        });
        done();
      });
  });
});
