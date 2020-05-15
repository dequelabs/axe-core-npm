var WebDriver = require('selenium-webdriver'),
  assert = require('chai').assert,
  AxeBuilder = require('../../lib');

describe('sauce-example', function() {
  this.timeout(10000);

  var driver;
  var url = 'https://github.com/dequelabs/axe-webdriverjs';
  before(function(done) {
    driver = new WebDriver.Builder()
      .usingServer('http://ondemand.saucelabs.com:80/wd/hub')
      .withCapabilities({
        browserName: 'Firefox',
        // you must set these environment variables
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY
      })
      .build();

    driver.get(url).then(function() {
      done();
    });
  });

  after(function() {
    driver.quit();
  });

  it('should find violations', function(done) {
    AxeBuilder(driver).analyze(function(err, results) {
      if (err) {
        return done(err);
      }
      assert.equal(results.url, url);
      done();
    });
  });
});
