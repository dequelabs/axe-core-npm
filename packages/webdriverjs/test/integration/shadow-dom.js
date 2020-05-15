var runWebdriver = require('../run-webdriver');
var assert = require('chai').assert;
var host = 'localhost';
var AxeBuilder = require('../../lib');
var path = require('path');
var { createServer } = require('http-server');

if (process.env.REMOTE_TESTSERVER_HOST) {
  host = process.env.REMOTE_TESTSERVER_HOST;
}

var shadowSupported;

describe('shadow-dom.html', function() {
  this.timeout(10000);

  var driver;
  var server;
  before(function(done) {
    driver = runWebdriver();
    driver
      .manage()
      .timeouts()
      .setScriptTimeout(10000);

    server = createServer({
      root: path.resolve(__dirname, '../..'),
      cache: -1
    });
    server.listen(9876, err => {
      if (err) {
        return done(err);
      }
      driver
        .get('http://' + host + ':9876/test/fixtures/shadow-dom.html')
        .then(function() {
          driver
            .executeAsyncScript(function(callback) {
              /* eslint-env browser */
              var script = document.createElement('script');
              script.innerHTML =
                "var shadowSupport = document.body && typeof document.body.attachShadow === 'function';";
              document.documentElement.appendChild(script);
              // eslint-disable-next-line no-undef
              callback(shadowSupport);
            })
            .then(function(shadowSupport) {
              shadowSupported = shadowSupport;
              done();
            })
            .catch(function() {
              done();
            });
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
    if (shadowSupported) {
      AxeBuilder(driver)
        .options({
          rules: {
            'landmark-one-main': { enabled: false },
            'page-has-heading-one': { enabled: false },
            region: { enabled: false }
          }
        })
        .analyze()
        .then(function(results) {
          assert.lengthOf(results.violations, 2);
          assert.equal(results.violations[0].id, 'aria-roles');
          assert.equal(results.violations[1].id, 'aria-valid-attr');
          done();
        });
    } else {
      // eslint-disable-next-line no-console
      console.log('Test skipped, Shadow DOM not supported');
      done();
    }
  });
});
