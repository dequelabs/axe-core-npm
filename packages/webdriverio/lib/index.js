const AxeBuilder = require('axe-webdriverjs');
const bindings = require('./bindings');

class AxeWebDriverIOBuilder extends AxeBuilder {
  constructor(driver, source) {
    super(bindings(driver), source);
  }
}

module.exports = AxeWebDriverIOBuilder;
