'use strict';

const WebDriver = require('selenium-webdriver');
const AxeBuilder = require('@axe-core/webdriverjs');

async function testPages(urls, config, events) {
  const driver = await config.driver;
  // End of the line, no more page left
  if (urls.length === 0) {
    driver.quit();
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    // Grab the first item on the URL list
    const currentUrl = urls[0].replace(/[,;]$/, '');

    if (events.onTestStart) {
      events.onTestStart(currentUrl);
    }
    if (config.timer) {
      events.startTimer('page load time');
    }

    driver
      .get(currentUrl)
      .then(function () {
        // https://github.com/vercel/pkg/issues/676
        // we need to pass a string vs a function so we manually stringified the function
        return driver.executeAsyncScript(`
          const callback = arguments[arguments.length - 1];
          const script = document.createElement('script');
          script.innerHTML = 'document.documentElement.classList.add("deque-axe-is-ready");'
          document.documentElement.appendChild(script);
          callback();
      `);
      })
      .then(function () {
        return driver.wait(
          WebDriver.until.elementsLocated(
            WebDriver.By.css('.deque-axe-is-ready')
          )
        );
      })
      .then(() => {
        if (config.timer) {
          events.startTimer('page load time');
        }

        if (config.loadDelay > 0) {
          events.waitingMessage(config.loadDelay);
        }
        return new Promise(function (resolve) {
          setTimeout(resolve, config.loadDelay);
        });
      })
      .then(() => {
        // Set everything up
        const axe = new AxeBuilder(driver, config.axeSource);

        if (Array.isArray(config.include)) {
          config.include.forEach(include => axe.include(include));
        }
        if (Array.isArray(config.exclude)) {
          config.exclude.forEach(exclude => axe.exclude(exclude));
        }

        // Can not use withTags and withRules together
        if (config.tags) {
          axe.withTags(config.tags);
        } else if (config.rules) {
          axe.withRules(config.rules);
        }
        if (config.disable) {
          axe.disableRules(config.disable);
        }
        if (config.timer) {
          events.startTimer('axe-core execution time');
        }

        // Run axe
        axe.analyze(function (err, results) {
          if (config.timer) {
            events.endTimer('axe-core execution time');
          }

          if (err) {
            return reject(err);
          }

          // Notify about the update
          if (events.onTestComplete) {
            events.onTestComplete(results);
          }

          // Move to the next item
          testPages(urls.slice(1), config, events).then(out => {
            resolve([results].concat(out));
          });
        });
      })
      .catch(e => {
        driver.quit();
        reject(e);
      });
  });
}

module.exports = testPages;
