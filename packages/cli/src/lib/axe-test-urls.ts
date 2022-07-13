import WebDriver from 'selenium-webdriver';
import AxeBuilder from '@axe-core/webdriverjs';
import { AxeResults } from 'axe-core';
import { EventResponse, ConfigParams } from '../types';

const testPages = async (
  urls: string | string[],
  config: ConfigParams,
  events?: EventResponse
): Promise<AxeResults[] | AxeResults> => {
  const driver: WebDriver.WebDriver = await config.driver;

  if (urls.length === 0) {
    await driver.quit();
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const currentUrl = urls[0].replace(/[,;]$/, '');

    if (events?.onTestStart) {
      events?.onTestStart(currentUrl);
    }

    if (config.timer) {
      events?.startTimer('axe page load time');
    }

    driver
      .get(currentUrl)
      .then(() => {
        return driver.executeAsyncScript(`
          const callback = arguments[arguments.length - 1];
          const script = document.createElement('script');
          script.innerHTML = 'document.documentElement.classList.add("deque-axe-is-ready");'
          document.documentElement.appendChild(script);
          callback();
      `);
      })
      .then(() => {
        return driver.wait(
          WebDriver.until.elementsLocated(
            WebDriver.By.css('.deque-axe-is-ready')
          ),
          10000
        );
      })
      .then(() => {
        if (config.timer) {
          events?.endTimer('axe page load time');
        }

        if (config.loadDelay) {
          events?.waitingMessage(config.loadDelay);
        }

        return new Promise(resolve => {
          setTimeout(resolve, config.loadDelay);
        });
      })
      .then(() => {
        const axe = new AxeBuilder(driver, config.axeSource);

        if (Array.isArray(config.include)) {
          config.include.forEach((include: string) => axe.include(include));
        }

        if (Array.isArray(config.exclude)) {
          config.exclude.forEach((exclude: string) => axe.exclude(exclude));
        }

        if (config.tags) {
          axe.withTags(config.tags);
        } else if (config.rules) {
          axe.withRules(config.rules);
        }

        /* istanbul ignore if */
        if (config.disable) {
          axe.disableRules(config.disable);
        }

        if (config.timer) {
          events?.startTimer('axe-core execution time');
        }

        axe.analyze((err: Error | null, results: AxeResults) => {
          if (config.timer) {
            events?.endTimer('axe-core execution time');
          }

          /* istanbul ignore if */
          if (err) {
            return reject(err);
          }

          // Notify about the update
          if (events?.onTestComplete) {
            events?.onTestComplete(results);
          }

          // Move to the next item
          testPages(urls.slice(1), config, events).then((out: AxeResults) => {
            resolve([results].concat(out));
          });
        });
      })
      .catch(async e => {
        await driver.quit();
        reject(e);
      });
  });
};

export default testPages;
