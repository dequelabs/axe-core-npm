import assert from 'assert';
import type { Page, Frame, ElementHandle } from 'playwright-core';
import type {
  RunOptions,
  AxeResults,
  SerialContextObject,
  Spec,
  PartialResults,
  SerialSelectorList,
  SerialFrameSelector
} from 'axe-core';
import axe from 'axe-core';
const { source } = axe;
import { normalizeContext, analyzePage } from './utils';
import type { AxePlaywrightParams } from './types';
import {
  axeFinishRun,
  axeGetFrameContexts,
  axeRunPartial,
  axeShadowSelect,
  chunkResultString
} from './browser';
import AxePartialRunner from './AxePartialRunner';

export default class AxeBuilder {
  private page: Page;
  private config: Spec | null;
  private includes: SerialSelectorList;
  private excludes: SerialSelectorList;
  private option: RunOptions;
  private source: string;
  private legacyMode = false;
  private errorUrl: string;

  constructor({ page, axeSource }: AxePlaywrightParams) {
    this.page = page;
    this.includes = [];
    this.excludes = [];
    this.config = {};
    this.option = {};
    this.source = axeSource || source;
    this.errorUrl =
      'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md';
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   * @param String selector
   * @returns this
   */

  public include(selector: SerialFrameSelector): this {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   * @param String selector
   * @returns this
   */

  public exclude(selector: SerialFrameSelector): this {
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   * @param RunOptions options
   * @returns AxeBuilder
   */

  public options(options: RunOptions): this {
    this.option = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
   * @param String|Array rules
   * @returns this
   */

  public withRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    /* istanbul ignore next */
    this.option = this.option || {};
    this.option.runOnly = {
      type: 'rule',
      values: rules
    };

    return this;
  }

  /**
   * Limit analysis to only specified tags.
   * Cannot be used with `AxeBuilder#withRules`
   * @param String|Array tags
   * @returns this
   */

  public withTags(tags: string | string[]): this {
    tags = Array.isArray(tags) ? tags : [tags];
    /* istanbul ignore next */
    this.option = this.option || {};
    this.option.runOnly = {
      type: 'tag',
      values: tags
    };
    return this;
  }

  /**
   * Set the list of rules to skip when running an analysis.
   * @param String|Array rules
   * @returns this
   */

  public disableRules(rules: string | string[]): this {
    rules = Array.isArray(rules) ? rules : [rules];
    /* istanbul ignore next */
    this.option = this.option || {};
    this.option.rules = {};

    for (const rule of rules) {
      this.option.rules[rule] = { enabled: false };
    }
    return this;
  }

  /**
   * Set configuration for `axe-core`.
   * This value is passed directly to `axe.configure()`
   */
  public configure(config: Spec): this {
    if (typeof config !== 'object') {
      throw new Error(
        'AxeBuilder needs an object to configure. See axe-core configure API.'
      );
    }
    this.config = config;
    return this;
  }

  /**
   * Use frameMessenger with <same_origin_only>
   *
   * This disables use of axe.runPartial() which is called in each frame, and
   * axe.finishRun() which is called in a blank page. This uses axe.run() instead,
   * but with the restriction that cross-origin frames will not be tested.
   */
  public setLegacyMode(legacyMode = true): this {
    this.legacyMode = legacyMode;
    return this;
  }

  /**
   * Perform analysis and retrieve results. *Does not chain.*
   * @return Promise<Result | Error>
   */

  public async analyze(): Promise<AxeResults> {
    const context = normalizeContext(this.includes, this.excludes);
    const { page } = this;

    await page.evaluate(this.script());
    const runPartialDefined = await page.evaluate<boolean>(
      'typeof window.axe.runPartial === "function"'
    );

    let results: AxeResults;

    if (!runPartialDefined || this.legacyMode) {
      results = await this.runLegacy(context);
      return results;
    }
    const partialResults = await this.runPartialRecursive(
      page.mainFrame(),
      context
    );
    const partials = await partialResults.getPartials();

    try {
      return await this.finishRun(partials);
    } catch (error) {
      throw new Error(
        `${(error as Error).message}\n Please check out ${this.errorUrl}`
      );
    }
  }

  /**
   * Injects `axe-core` into all frames.
   * @param Page - playwright page object
   * @returns Promise<void>
   */

  private async inject(frames: Frame[], shouldThrow?: boolean): Promise<void> {
    for (const iframe of frames) {
      const race = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Script Timeout'));
        }, 1000);
      });
      const evaluate = iframe.evaluate(this.script());

      try {
        await Promise.race([evaluate, race]);
        await iframe.evaluate(await this.axeConfigure());
      } catch (err) {
        // in legacy mode we don't want to throw the error we just want to skip injecting into the frame
        if (shouldThrow) {
          throw err;
        }
      }
    }
  }

  /**
   * Get axe-core source and configurations
   * @returns String
   */

  private script(): string {
    return this.source;
  }

  private async runLegacy(context: SerialContextObject): Promise<AxeResults> {
    // in playwright all frames are available in `.frames()`, even nested and
    // shadowDOM iframes. also navigating to a url causes it to be put into
    // an iframe so we don't need to inject into the page object itself
    const frames = this.page.frames();
    await this.inject(frames);
    const axeResults = await this.page.evaluate(analyzePage, {
      context,
      options: this.option
    });

    if (axeResults.error) {
      throw new Error(axeResults.error);
    }

    return axeResults.results;
  }

  /**
   * Inject `axe-core` into each frame and run `axe.runPartial`.
   * Because we need to inject axe into all frames all at once
   * (to avoid any potential problems with the DOM becoming out-of-sync)
   * but also need to not process results for any child frames if the parent
   * frame throws an error (requirements of the data structure for `axe.finishRun`),
   *  we have to return a deeply nested array of Promises and then flatten
   * the array once all Promises have finished, throwing out any nested Promises
   * if the parent Promise is not fulfilled.
   * @param frame - playwright frame object
   * @param context - axe-core context object
   * @returns Promise<AxePartialRunner>
   */

  private async runPartialRecursive(
    frame: Frame,
    context: SerialContextObject
  ): Promise<AxePartialRunner> {
    const frameContexts = await frame.evaluate(axeGetFrameContexts, {
      context
    });
    const partialPromise = frame.evaluate(axeRunPartial, {
      context,
      options: this.option
    });
    const initiator = frame === this.page.mainFrame();
    const axePartialRunner = new AxePartialRunner(partialPromise, initiator);

    for (const { frameSelector, frameContext } of frameContexts) {
      let childResults: AxePartialRunner | null = null;
      try {
        const iframeHandle = await frame.evaluateHandle(axeShadowSelect, {
          frameSelector
        });
        // note: these can return null but the catch will handle this properly for all cases
        const iframeElement =
          iframeHandle.asElement() as ElementHandle<Element>;
        const childFrame = await iframeElement.contentFrame();
        if (childFrame) {
          await this.inject([childFrame], true);
          childResults = await this.runPartialRecursive(
            childFrame,
            frameContext
          );
        }
      } catch {
        /* do nothing */
      }
      axePartialRunner.addChildResults(childResults);
    }

    return axePartialRunner;
  }

  private async finishRun(partialResults: PartialResults): Promise<AxeResults> {
    const { page, option: options } = this;
    const context = page.context();
    const blankPage = await context.newPage();

    assert(
      blankPage,
      'Please make sure that you have popup blockers disabled.'
    );

    await blankPage.evaluate(this.script());
    await blankPage.evaluate(await this.axeConfigure());

    // evaluate has a size limit on the number of characters so we'll need
    // to split partialResults into chunks if it exceeds that limit.
    const sizeLimit = 60_000_000;
    const partialString = JSON.stringify(partialResults);

    async function chunkResults(result: string): Promise<void> {
      const chunk = result.substring(0, sizeLimit);
      await blankPage.evaluate(chunkResultString, chunk);

      if (result.length > sizeLimit) {
        return await chunkResults(result.substr(sizeLimit));
      }
    }

    await chunkResults(partialString);
    return await blankPage
      .evaluate(axeFinishRun, {
        options
      })
      .finally(async () => {
        await blankPage.close();
      });
  }

  private async axeConfigure(): Promise<string> {
    const hasRunPartial = await this.page.evaluate<boolean>(
      'typeof window.axe?.runPartial === "function"'
    );

    const allowedOrigins =
      !this.legacyMode && !hasRunPartial
        ? ['<unsafe_all_origins>']
        : ['<same_origin>'];
    const branding = { application: 'playwright' };

    const axeConfig = {
      allowedOrigins: allowedOrigins,
      branding: branding
    };

    const jsonString = JSON.stringify({ ...axeConfig, ...this.config });

    return `
    ;axe.configure(
      ${jsonString}
    )
    `;
  }
}

export { AxeBuilder };
