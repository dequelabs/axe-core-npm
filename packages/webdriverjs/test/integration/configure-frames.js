const runWebdriver = require('../run-webdriver');
const assert = require('chai').assert;
let host = 'localhost';
const json = require('../fixtures/custom-rule-config.json');
const AxeBuilder = require('../../lib');
const path = require('path');
const { createServer } = require('http-server');

if (process.env.REMOTE_TESTSERVER_HOST) {
  host = process.env.REMOTE_TESTSERVER_HOST;
}

describe('outer-configure-frame.html', function () {
  this.timeout(10000);

  let server;
  let driver;
  before(function (done) {
    driver = runWebdriver();
    driver.manage().timeouts().setScriptTimeout(10000);

    server = createServer({
      root: path.resolve(__dirname, '../..'),
      cache: -1
    });
    server.listen(9876, err => {
      if (err) {
        return done(err);
      }
      driver
        .get(
          'http://' + host + ':9876/test/fixtures/outer-configure-frame.html'
        )
        .then(function () {
          done();
        });
    });
  });

  after(function () {
    server.close();
    driver.quit();
  });

  it('should find configured violations in all frames', function (done) {
    new AxeBuilder(driver)
      .options({
        rules: {
          'landmark-one-main': { enabled: false },
          'page-has-heading-one': { enabled: false },
          region: { enabled: false },
          'html-lang-valid': { enabled: false },
          bypass: { enabled: false }
        }
      })
      .configure(json)
      .analyze()
      .then(function (results) {
        assert.equal(results.violations[0].id, 'dylang');
        // the second violation is in a frame
        assert.equal(results.violations[0].nodes.length, 2);

        done();
      });
  });
});

describe('sandbox-outer-configure-frame.html', function () {
  this.timeout(10000);

  let server;
  let driver;
  before(function (done) {
    driver = runWebdriver();
    driver.manage().timeouts().setScriptTimeout(10000);

    server = createServer({
      root: path.resolve(__dirname, '../..'),
      cache: -1
    });
    server.listen(9876, err => {
      if (err) {
        return done(err);
      }
      driver
        .get(
          'http://' +
            host +
            ':9876/test/fixtures/sandbox-outer-configure-frame.html'
        )
        .then(function () {
          done();
        });
    });
  });

  after(function () {
    server.close();
    driver.quit();
  });

  it('should find configured violations in all frames', function (done) {
    const axeBuilder = new AxeBuilder(driver, null, { noSandbox: true });
    axeBuilder
      .options({
        rules: {
          'landmark-one-main': { enabled: false },
          'page-has-heading-one': { enabled: false },
          region: { enabled: false },
          'html-lang-valid': { enabled: false },
          bypass: { enabled: false }
        }
      })
      .configure(json)
      .analyze()
      .then(function (results) {
        assert.equal(results.violations[0].id, 'dylang');
        // the second violation is in a frame
        assert.equal(results.violations[0].nodes.length, 2);

        done();
      });
  });
});

describe('sandbox-nested-configure-frame.html', function () {
  this.timeout(10000);

  let server;
  let driver;
  before(function (done) {
    driver = runWebdriver();
    driver.manage().timeouts().setScriptTimeout(10000);

    server = createServer({
      root: path.resolve(__dirname, '../..'),
      cache: -1
    });
    server.listen(9876, err => {
      if (err) {
        return done(err);
      }
      driver
        .get(
          'http://' +
            host +
            ':9876/test/fixtures/sandbox-nested-configure-frame.html'
        )
        .then(function () {
          done();
        });
    });
  });

  after(function () {
    server.close();
    driver.quit();
  });

  it('should find configured violations in all frames', function (done) {
    const axeBuilder = new AxeBuilder(driver, null, { noSandbox: true });
    axeBuilder
      .options({
        rules: {
          'landmark-one-main': { enabled: false },
          'page-has-heading-one': { enabled: false },
          region: { enabled: false },
          'html-lang-valid': { enabled: false },
          bypass: { enabled: false }
        }
      })
      .configure(json)
      .analyze()
      .then(function (results) {
        assert.equal(results.violations[0].id, 'dylang');
        // the third violation is in a frame of a frame
        assert.deepEqual(results.violations[0].nodes[2].target, [
          'iframe',
          'iframe',
          'html'
        ]);

        done();
      });
  });
});
