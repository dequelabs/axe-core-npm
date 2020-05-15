var AxeBuilder = require('./lib');
var WebDriver = require('selenium-webdriver');

var driver = new WebDriver.Builder().forBrowser('chrome').build();
driver.get('https://html5-sandbox.glitch.me/').then(function() {
  const axe = new AxeBuilder(driver, null, { noSandbox: true })
  axe.analyze(function(err, results) {
    if (err) {
      // Handle error somehow
    }
    console.log(results);
  });
});
