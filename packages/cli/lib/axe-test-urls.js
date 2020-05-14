'use strict';

const WebDriver = require('selenium-webdriver');
const AxeBuilder = require('axe-webdriverjs');
const { startDriver, stopDriver } = require('./webdriver');

function testPages(urls, config, events) {
  const driver = config.driver;
  // Setup webdriver
  if (!driver) {
    return startDriver(config).then(function (config) {
      return testPages(urls, config, events);
    });
  }

  // End of the line, no more page left
  if (urls.length === 0) {
    stopDriver(config);
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    // Grab the first item on the URL list
    const currentUrl = urls[0].replace(/[,;]$/, '');

    if (events.onTestStart) {
      events.onTestStart(currentUrl);
    }
    if (config.timer) {
      console.log(' ');
      console.time('page load time');
    }

    driver
      .get(currentUrl)
      .then(function () {
        // Wait for the page to be loaded
        return driver.executeAsyncScript(function (callback) {
          const script = document.createElement('script');
          script.innerHTML =
            'document.documentElement.classList.add("deque-axe-is-ready");';
          document.documentElement.appendChild(script);
          callback();
        });
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
          console.timeEnd('page load time');
        }

        if (config.loadDelay > 0) {
          console.log(
            'Waiting for ' +
              config.loadDelay +
              ' milliseconds after page load...'
          );
        }
        return new Promise(function (resolve) {
          setTimeout(resolve, config.loadDelay);
        });
      })
      .then(() => {
        // Set everything up
        const axe = AxeBuilder(driver, config.axeSource);

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
          console.time('axe-core execution time');
        }

        // Run axe
        axe.analyze(function (err, results) {
          if (config.timer) {
            console.timeEnd('axe-core execution time');
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
