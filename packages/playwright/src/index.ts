import * as fs from 'fs';
import * as assert from 'assert';
import type { Page, Frame, ElementHandle } from 'playwright';
import type {
  RunOptions,
  AxeResults,
  ContextObject,
  PartialResults
} from 'axe-core';
import { normalizeContext, analyzePage } from './utils';
import type { AxePlaywrightParams } from './types';
import {
  axeFinishRun,
  axeGetFrameContexts,
  axeRunPartial,
  axeShadowSelect
} from './browser';
import AxePartialRunner from './AxePartialRunner';

export default class AxeBuilder {
  private page: Page;
  private includes: string[][];
  private excludes: string[][];
  private option: RunOptions;
  private source: string;
  private legacyMode = false;

  constructor({ page, axeSource }: AxePlaywrightParams) {
    const axePath = require.resolve('axe-core');
    const source = fs.readFileSync(axePath, 'utf-8');
    this.page = page;
    this.includes = [];
    this.excludes = [];
    this.option = {};
    this.source = axeSource || source;
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   * @param String selector
   * @returns this
   */

  public include(selector: string | string[]): this {
    selector = Array.isArray(selector) ? selector : [selector];
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   * @param String selector
   * @returns this
   */

  public exclude(selector: string | string[]): this {
    selector = Array.isArray(selector) ? selector : [selector];
    for (var selection of selector) {
      this.excludes.push([selection]);
    }
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
    const { page, option: options } = this;

    page.evaluate(this.script());
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
        `${(error as Error).message
        }\n Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md`
      );
    }
  }

  /**
   * Injects `axe-core` into all frames.
   * @param Page - playwright page object
   * @returns Promise<void>
   */

  private async inject(frames: Frame[]): Promise<void> {
    for (const iframe of frames) {
      await iframe.evaluate(this.script());
    }
  }

  /**
   * Get axe-core source and configurations
   * @returns String
   */

  private script(): string {
    return `
      ${this.source}
      axe.configure({
        ${this.legacyMode ? '' : 'allowedOrigins: ["<unsafe_all_origins>"],'}
        branding: { application: 'playwright' }
      })
    `;
  }

  private async runLegacy(context: ContextObject): Promise<AxeResults> {
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
    context: ContextObject
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
          await this.inject([childFrame]);
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

    blankPage.evaluate(this.script());

    return await blankPage
      .evaluate(axeFinishRun, {
        partialResults,
        options
      })
      .finally(() => {
        blankPage.close();
      });
  }
}
