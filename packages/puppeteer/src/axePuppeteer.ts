import assert from 'assert';
import { RunOptions, ContextObject, Spec, AxeResults } from 'axe-core';
import { Frame, JSONArray, JSONObject, Page } from 'puppeteer';
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

  public include(selector: string | string[]): this {
    selector = arrayify(selector);
    this.includes.push(selector);
    return this;
  }

  public exclude(selector: string | string[]): this {
    selector = arrayify(selector);
    this.excludes.push(selector);
    return this;
  }

  public options(options: RunOptions): this {
    this.axeOptions = options;
    return this;
  }

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

  public configure(config: Spec): this {
    assert(
      typeof config === 'object',
      'AxePuppeteer needs an object to configure. See axe-core configure API.'
    );
    this.config = config;
    return this;
  }

  public disableFrame(selector: string): this {
    this.disabledFrameSelectors.push(selector);
    return this;
  }

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
        callback(err);
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
    if (runPartialSupported !== true || this.page === undefined) {
      return this.runLegacy(context);
    }
    const partialRunner = await this.runPartialRecursive(frame, context);
    const partials = await partialRunner.getPartials();

    try {
      return await this.finishRun(partials);
    } catch (error) {
      throw new Error(
        `Error: ${error}\n Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/puppeteer/error-handling.md`
      );
    }
  }

  private async runPartialRecursive(
    frame: Frame,
    context: ContextObject
  ): Promise<AxePartialRunner> {
    // IMPORTANT: axeGetFrameContext MUST be called before axeRunPartial
    const frameContexts = await frame.evaluate(axeGetFrameContext, context);

    // Start testing the parent frame - don't await, so runs are in parallel
    const options = this.axeOptions as JSONObject;
    const partialPromise = frame.evaluate(axeRunPartial, context, options);
    const initiator = frame === this.frame;
    const axePartialRunner = new AxePartialRunner(partialPromise, initiator);

    // Recursively start testing child frames
    for (const { frameSelector, frameContext } of frameContexts) {
      let childResults: AxePartialRunner | null = null;
      try {
        const childFrame = await getChildFrame(frame, frameSelector);
        if (childFrame) {
          await frameSourceInject(childFrame, this.axeSource, this.config);
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
    const { axeOptions, axeSource, config, page } = this;
    assert(page, 'Running AxePuppeteer with a frame object is deprecated');

    const browser = page.browser();
    const blankPage = await browser.newPage();
    await frameSourceInject(blankPage.mainFrame(), axeSource, config);
    return await blankPage
      .evaluate(
        axeFinishRun,
        partialResults as JSONArray,
        axeOptions as JSONObject
      )
      .finally(() => {
        blankPage.close();
      });
  }

  private async runLegacy(context: ContextObject): Promise<AxeResults> {
    const options = this.axeOptions as JSONObject;
    const selector = iframeSelector(this.disabledFrameSelectors);
    const source = this.axeSource;
    await injectJS(this.frame, { source, selector });

    await injectJS(this.frame, {
      source: axeConfigure,
      selector,
      args: [this.config]
    });

    return this.frame.evaluate(axeRunLegacy, context, options);
  }
}
