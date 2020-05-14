// Adapter from axe-webdriverjs.
// This test tests to make sure that a valid configuration works.

import { expect } from 'chai'
import Puppeteer from 'puppeteer'
import AxePuppeteer from '../../src/index'
import { customConfig, fixtureFilePath } from '../utils'

describe('doc-dylang.html', function() {
  before(async function() {
    this.timeout(10000)

    const args = []
    if (process.env.CI) {
      args.push('--no-sandbox', '--disable-setuid-sandbox')
    }
    this.browser = await Puppeteer.launch({ args })
  })
  after(async function() {
    await this.browser.close()
  })
  beforeEach(async function() {
    this.page = await this.browser.newPage()
  })
  afterEach(async function() {
    await this.page.close()
  })

  it('should find violations with customized helpUrl', async function() {
    const file = fixtureFilePath('doc-dylang.html')
    const config = await customConfig()

    await this.page.goto(`file://${file}`)

    const results = await new AxePuppeteer(this.page)
      .configure(config)
      .withRules(['dylang'])
      .analyze()

    expect(results.violations).to.have.lengthOf(1)
    expect(results.violations[0].id).to.eql('dylang')
    expect(
      results.violations[0].helpUrl.indexOf(
        'application=axe-puppeteer'
      )
    ).to.not.eql(-1)
    expect(results.passes).to.have.lengthOf(0)
  })
})
