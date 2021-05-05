import type { Page, Frame } from 'playwright';
import type { RunOptions, AxeResults } from 'axe-core';
import { source } from 'axe-core';
import { normalizeContext, analyzePage } from './utils';
import type { AxePlaywrightParams } from './types';

export default class AxeBuilder {
  private page: Page;
  private includes: string[];
  private excludes: string[];
  private option: RunOptions;
  private source: string;
  constructor({ page }: AxePlaywrightParams) {
    this.page = page;
    this.includes = [];
    this.excludes = [];
    this.option = {};
    this.source = source;
  }

  /**
   * Selector to include in analysis.
   * This may be called any number of times.
   * @param {String} selector
   * @returns {AxeBuilder}
   */

  public include(selector: string): AxeBuilder {
    this.includes.push(selector);
    return this;
  }

  /**
   * Selector to exclude in analysis.
   * This may be called any number of times.
   * @param {String} selector
   * @returns {AxeBuilder}
   */

  public exclude(selector: string): AxeBuilder {
    this.excludes.push(selector);
    return this;
  }

  /**
   * Set options to be passed into axe-core
   * @param {RunOptions} options
   * @returns {AxeBuilder}
   */

  public options(options: RunOptions): AxeBuilder {
    this.option = options;
    return this;
  }

  /**
   * Limit analysis to only the specified rules.
   * Cannot be used with `AxeBuilder#withTags`
   * @param {String|Array} rules
   * @returns {AxeBuilder}
   */

  public withRules(rules: string | string[]): AxeBuilder {
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
   * @param {String|Array} tags
   * @returns {AxeBuilder}
   */

  public withTags(tags: string | string[]): AxeBuilder {
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
   * @param {String|Array} rules
   * @returns {AxeBuilder}
   */

  public disableRules(rules: string | string[]): AxeBuilder {
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
   * Perform analysis and retrieve results. *Does not chain.*
   * @return {Promise<Result | Error>}
   */

  public async analyze(): Promise<AxeResults> {
    const context = normalizeContext(this.includes, this.excludes);
    const page = this.page;
    const options = this.option;
    await page.evaluate(this.script());
    const frames = page.frames();
    await this.inject(frames);
    const { results, error } = await page.evaluate(analyzePage, {
      context,
      options
    });
    /* istanbul ignore if */
    if (error) {
      throw new Error(error);
    }

    return results as AxeResults;
  }

  /**
   * Injects `axe-core` into all frames.
   * @param Page - playwright page object
   * @returns Promise<void>
   */

  private async inject(frames: Frame[]): Promise<void> {
    for (const iframe of frames) {
      await iframe.evaluate(this.script());
      const childFrames = iframe.childFrames();
      for (const childFrame of childFrames) {
        frames.push(childFrame);
        await this.inject(childFrame.childFrames());
      }
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
          allowedOrigins: ['<unsafe_all_origin>'], 
          branding: { application: 'playwright' }
        })
        `;
  }
}
