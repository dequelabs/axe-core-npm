/**
 * This test tests to make sure that a valid configuration works. Requires
 * axe-core >= 2.0.0, hence the temporary conditional check for a local version
 * of axe-core
 */
const runWebdriver = require('../run-webdriver');
const json = require('../fixtures/custom-rule-config.json');
const assert = require('chai').assert;
const AxeBuilder = require('../../lib');
let host = 'localhost';
const path = require('path');
const { createServer } = require('http-server');

const axe = require('axe-core');

if (process.env.REMOTE_TESTSERVER_HOST) {
  host = process.env.REMOTE_TESTSERVER_HOST;
}

describe('doc-dylang.html', function () {
  this.timeout(10000);

  let driver;
  let server;
  before(function (done) {
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
        .get('http://' + host + ':9876/test/fixtures/doc-dylang.html')
        .then(function () {
          done();
        });
    });
  });

  after(function (done) {
    server.close();
    driver.quit().then(function () {
      done();
    });
  });

  it('should find violations with customized helpUrl', function (done) {
    const src = axe.source;
    new AxeBuilder(driver, src)
      .configure(json)
      .withRules(['dylang'])
      .analyze()
      .then(function (results) {
        assert.lengthOf(results.violations, 1);
        assert.equal(results.violations[0].id, 'dylang');
        assert.notEqual(
          results.violations[0].helpUrl.indexOf('application=webdriverjs'),
          -1
        );
        assert.lengthOf(results.passes, 0);
        done();
      });
  });
});
