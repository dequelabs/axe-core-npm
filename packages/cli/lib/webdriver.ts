import * as chromedriver from 'chromedriver'
import { Builder, Capabilities, WebDriver } from 'selenium-webdriver'
import * as chrome from 'selenium-webdriver/chrome'

interface StopDriver {
  driver: WebDriver
}

export const startDriver = async (config: any): Promise<any> => {
  let builder: Builder
  const args: chrome.Options[] = []
  const scriptTimeout: number = (config.timeout || 20) * 1000.0

  if (config.browser === 'chrome-headless') {
    const service = new chrome.ServiceBuilder(
      config.chromedriverPath || chromedriver.path
    ).build()
    chrome.setDefaultService(service)

    if (config.chromeOptions) {
      args.push(...config.chromeOptions)
    }

    const chromeCapabilities = Capabilities.chrome()
    chromeCapabilities.set('chromeOptions', { args })

    builder = new Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeCapabilities)
      .setChromeOptions(new chrome.Options().headless())
  } else {
    builder = new Builder().forBrowser(config.browser)
  }

  config.driver = builder.build()
  config.builder = builder
  
  return config.driver
    .manage()
    .setTimeouts({ script: scriptTimeout })
    .then(() => config)
}

export const stopDriver = (config: StopDriver) => {
  config.driver.quit()
}
