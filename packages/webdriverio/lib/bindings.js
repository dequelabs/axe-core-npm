module.exports = function bind(driver) {
  const webdriver = driver;

  if (
    typeof webdriver.executeScript !== 'function' &&
    typeof webdriver.execute === 'function'
  ) {
    webdriver.executeScript = function executeScript() {
      return this.execute.apply(this, arguments);
    }.bind(webdriver);
  }

  if (
    typeof webdriver.executeAsyncScript !== 'function' &&
    typeof webdriver.executeAsync === 'function'
  ) {
    webdriver.executeAsyncScript = function executeAsyncScript() {
      return this.executeAsync.apply(this, arguments);
    }.bind(webdriver);
  }

  if (
    typeof webdriver.switchTo !== 'function' &&
    typeof webdriver.frame === 'function'
  ) {
    webdriver.switchTo = function switchTo() {
      return {
        window: function window() {
          return this.window.apply(this, arguments);
        }.bind(this),
        frame: function frame() {
          return this.frame.apply(this, arguments);
        }.bind(this),
        defaultContent: function defaultContent() {
          return this.frame.apply(this, null);
        }.bind(this)
      };
    }.bind(webdriver);
  }

  if (
    typeof webdriver.findElements !== 'function' &&
    typeof webdriver.elements === 'function'
  ) {
    webdriver.findElements = function findElements(selector) {
      return webdriver.elements(`<${selector.tagName}>`);
    }.bind(webdriver);
  }

  return webdriver;
};
