import * as Axe from 'axe-core';
import { Browser, Page } from 'puppeteer';
import { AxePuppeteer } from './axePuppeteer';
import { AnalyzeCB, IPageOptions } from './types';

/**
 * Go to a url, returning an instance of AxePuppeteer once completed
 */
export async function loadPage(
  browser: Browser,
  url: string,
  pageOpts: IPageOptions = {}
): Promise<OwningAxePuppeteer> {
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.goto(url, pageOpts.opts);

  return new OwningAxePuppeteer(page, pageOpts.source);
}

// An instance of AxePuppeteer that owns a page and thus closes it after running axe.
class OwningAxePuppeteer extends AxePuppeteer {
  private newPage: Page;

  constructor(page: Page, source?: string) {
    super(page, source);
    this.newPage = page;
  }

  public async analyze(): Promise<Axe.AxeResults>;
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | null>;
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | null> {
    try {
      return await super.analyze(callback);
    } finally {
      await this.newPage.close();
    }
  }
}
