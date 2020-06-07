import * as WebDriver from 'selenium-webdriver'
import { AxeBuilder } from 'axe-webdriverjs'
import { stopDriver } from './webdriver'

const testPages = async (urls: string[], config, events): Promise<any> => {
  const driver = await config.driver

  if (urls.length === 0) {
    stopDriver(driver)
    return Promise.resolve([])
  }
  return new Promise((resolve, reject) => {
    const currentURL = urls[0].replace(/[,;]$/, '')

    if (events.onTestStart) {
      events.onTestStart(currentURL)
    }

    if (config.timer) {
      events.startTimer('page load time')
    }

    driver
      .get(currentURL)
      .then(() =>
        driver.executeAsyncScript(callback => {
          const script = document.createElement('script')
          script.innerHTML =
            'document.documentElement.classList.add("deque-axe-is-ready");'
          document.documentElement.appendChild(script)
          callback()
        })
      )
      .then(() =>
        driver.wait(
          WebDriver.until.elementsLocated(
            WebDriver.By.css('.deque-axe-is-ready')
          )
        )
      )
      .then(() => {
        if (config.timer) {
          events.endTimer('page load time')
        }

        if (config.loadDelay > 0) {
          events.waitingMessage(config.loadDelay)
        }

        return new Promise(resolve => {
          setTimeout(resolve, config.loadDelay)
        })
      })
      .then(() => {
        const axe = AxeBuilder(driver)

        if (Array.isArray(config.include)) {
          config.include.forEach((include: string) => axe.include(include))
        }

        if (Array.isArray(config.exclude)) {
          config.exclude.forEach((exclude: string) => axe.exclude(exclude))
        }

        if (config.tags) {
          axe.withTags(config.tags)
        } else if (config.rules) {
          axe.withRules(config.rules)
        }

        if (config.disable) {
          axe.disableRules(config.disable)
        }

        if (config.timer) {
          events.startTimer('axe-core execution-time')
        }

        axe.analyze((err, results) => {
          if (config.timer) {
            events.endTimer('axe-core execution time')
          }

          if (err) {
            return reject(err)
          }

          if (events.onTestComplete) {
            events.onTestComplete(results)
          }

          testPages(urls.slice(1), config, events).then(out =>
            resolve([results].concat(out))
          )
        })
      })
      .catch(e => {
        driver.quit()
        reject(e)
      })
  })
}

export default testPages
