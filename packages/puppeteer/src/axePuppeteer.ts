import assert from 'assert';
import { RunOptions, SerialContextObject, Spec, AxeResults } from 'axe-core';
import { Frame, Page } from 'puppeteer';
import {
  axeGetFrameContext,
  axeRunPartial,
  axeFinishRun,
  axeConfigure,
  axeRunLegacy,
  axeRunPartialSupport
} from './browser';
import { AnalyzeCB, PartialResults } from './types';
import { iframeSelector, injectJS } from './legacy';
import { AxePartialRunner } from './axePartialRunner';
import {
  arrayify,
  getChildFrame,
  normalizeContext,
  frameSourceInject
} from './utils';

export class AxePuppeteer {
  private frame: Frame;
  private axeSource?: string;
  private includes: string[][];
  private excludes: string[][];
  private axeOptions: RunOptions;
  private config: Spec | null;
  private disabledFrameSelectors: string[];
  private page: Page | undefined;
  private legacyMode = false;

  constructor(pageFrame: Page | Frame, source?: string) {
    if ('mainFrame' in pageFrame) {
      if ('browser' in pageFrame) {
        this.page = pageFrame;
      } else {
        console.warn(
          'AxePuppeteer support for Puppeteer <= 3.0.3 is deprecated'
        );
      }
      this.frame = pageFrame.mainFrame();
    } else {
      console.warn(
        'AxePuppeteer construction with Frame objects is deprecated.'
      );
      this.frame = pageFrame;
    }

    this.axeSource = source;
    this.includes = [];
    this.excludes = [];
    this.axeOptions = {};
    this.config = null;
    this.disabledFrameSelectors = [];
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   */
  public include(selector: string | string[]): this {
    selector = arrayify(selector);
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   */
  public exclude(selector: string | string[]): this {
    selector = arrayify(selector);
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   */
  public options(options: RunOptions): this {
    this.axeOptions = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
   */
  public withRules(rules: string | string[]): this {
    rules = arrayify(rules);
    if (!this.axeOptions) {
      this.axeOptions = {};
    }

    this.axeOptions.runOnly = {
      type: 'rule',
      values: rules
    };

    return this;
  }

  /**
   * Limit analysis to only specified tags.
   * Cannot be used with `AxeBuilder#withRules`
   */
  public withTags(tags: string | string[]): this {
    tags = arrayify(tags);
    if (!this.axeOptions) {
      this.axeOptions = {};
    }

    this.axeOptions.runOnly = {
      type: 'tag',
      values: tags
    };

    return this;
  }

  /**
   * Set the list of rules to skip when running an analysis.
   */
  public disableRules(rules: string | string[]): this {
    rules = arrayify(rules);
    interface IRulesObj {
      [id: string]: {
        enabled: boolean;
      };
    }
    const newRules: IRulesObj = {};
    for (const rule of rules) {
      newRules[rule] = {
        enabled: false
      };
    }
    this.axeOptions.rules = newRules;
    return this;
  }

  /**
   * Set configuration for `axe-core`.
   * This value is passed directly to `axe.configure()`
   */
  public configure(config: Spec): this {
    assert(
      typeof config === 'object',
      'AxePuppeteer needs an object to configure. See axe-core configure API.'
    );
    this.config = config;
    return this;
  }

  /**
   * Exclude specific frames from a test
   */
  public disableFrame(selector: string): this {
    this.disabledFrameSelectors.push(selector);
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
   */
  public async analyze(): Promise<AxeResults>;
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<AxeResults | null>;
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<AxeResults | null> {
    try {
      const axeResults = await this.analyzePromise();
      if (callback) {
        callback(null, axeResults);
      }
      return axeResults;
    } catch (err) {
      if (callback) {
        callback(err as Error);
        return null;
      }
      throw err;
    }
  }

  private async analyzePromise(): Promise<AxeResults> {
    const { frame, axeSource, config } = this;
    const context = normalizeContext(
      this.includes,
      this.excludes,
      this.disabledFrameSelectors
    );
    await frameSourceInject(frame, axeSource, config);

    const runPartialSupported = await frame.evaluate(axeRunPartialSupport);
    if (
      runPartialSupported !== true ||
      this.page === undefined ||
      this.legacyMode
    ) {
      return this.runLegacy(context);
    }
    const partialRunner = await this.runPartialRecursive(frame, context);
    const partials = await partialRunner.getPartials();

    try {
      return await this.finishRun(partials);
    } catch (error) {
      throw new Error(
        `${
          (error as Error).message
        }\n Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/puppeteer/error-handling.md`
      );
    }
  }

  private async runPartialRecursive(
    frame: Frame,
    context: SerialContextObject
  ): Promise<AxePartialRunner> {
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await frame.evaluate(axeGetFrameContext, context);

    // Start testing the parent frame - don't await, so runs are in parallel
    const options = this.axeOptions;
    const partialPromise = frame.evaluate(axeRunPartial, context, options);
    const initiator = frame === this.frame;
    const axePartialRunner = new AxePartialRunner(partialPromise, initiator);

    // Recursively start testing child frames
    for (const { frameSelector, frameContext } of frameContexts) {
      try {
        let childResults: AxePartialRunner | null = null;
        const childFrame = await getChildFrame(frame, frameSelector);
        if (childFrame) {
          await frameSourceInject(childFrame, this.axeSource, this.config);
          childResults = await this.runPartialRecursive(
            childFrame,
            frameContext
          );
        }
        axePartialRunner.addChildResults(childResults);
      } catch {
        axePartialRunner.addChildResults(null);
      }
    }
    return axePartialRunner;
  }

  private async finishRun(partialResults: PartialResults): Promise<AxeResults> {
    const { axeOptions, axeSource, config, page } = this;
    assert(page, 'Running AxePuppeteer with a frame object is deprecated');

    const browser = page.browser();
    const blankPage = await browser.newPage();

    assert(
      blankPage,
      'Please make sure that you have popup blockers disabled.'
    );

    await frameSourceInject(blankPage.mainFrame(), axeSource, config);
    return await blankPage
      .evaluate(axeFinishRun, partialResults, axeOptions)
      .finally(async () => {
        await blankPage.close();
      });
  }

  private async runLegacy(context: SerialContextObject): Promise<AxeResults> {
    const options = this.axeOptions;
    const selector = iframeSelector(this.disabledFrameSelectors);
    const source = this.axeSource;
    let config = this.config;

    if (!this.legacyMode) {
      config = {
        ...(config || {}),
        allowedOrigins: ['<unsafe_all_origins>']
      };
    }

    await injectJS(this.frame, { source, selector });
    await injectJS(this.frame, {
      source: axeConfigure,
      selector,
      args: [config]
    });
    return this.frame.evaluate(axeRunLegacy, context, options);
  }
}
