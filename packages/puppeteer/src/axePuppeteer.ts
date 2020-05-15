import * as Axe from 'axe-core';
import { Frame, JSONObject, Page } from 'puppeteer';
import { pageIsLoaded, runAxe } from './browser';
import { AnalyzeCB } from './types';

function arrayify<T>(src: T | T[]): T[] {
  if (!Array.isArray(src)) {
    return [src];
  }
  return src;
}

function injectAxeModule(frame: Frame): Promise<void> {
  return frame.addScriptTag({
    path: require.resolve('axe-core')
  });
}

function injectAxeString(frame: Frame, source: string): Promise<void> {
  return frame.evaluate(source);
}

function injectAxeChild(frame: Frame, source?: string): Array<Promise<void>> {
  const injections = frame
    .childFrames()
    .map(subFrame => injectAxeChild(subFrame, source))
    .reduce((acc, arr) => acc.concat(arr), []);

  const reportError = () => {
    // tslint:disable-next-line:no-console
    console.error(`Failed to inject axe-core into frame (${frame.url()})`);
  };

  let injectP: Promise<void>;
  if (!source) {
    injectP = injectAxeModule(frame);
  } else {
    injectP = injectAxeString(frame, source);
  }

  // Just print diagnostic if a child frame fails to load.
  // Don't fully error since we aren't the top-level frame
  injections.push(injectP.catch(reportError));
  return injections;
}

function injectAxe(frame: Frame, source?: string): Promise<void> {
  const injections = frame
    .childFrames()
    .map(subFrame => injectAxeChild(subFrame, source))
    .reduce((acc, arr) => acc.concat(arr), []);

  let injectP: Promise<void>;
  if (!source) {
    injectP = injectAxeModule(frame);
  } else {
    injectP = injectAxeString(frame, source);
  }

  injections.push(injectP);
  return Promise.all(injections).then(() => undefined);
}

function isPage(pageFrame: Page | Frame): pageFrame is Page {
  return (pageFrame as any).mainFrame !== undefined;
}

function getFrame(pageFrame: Page | Frame): Frame {
  if (isPage(pageFrame)) {
    return pageFrame.mainFrame();
  }
  return pageFrame;
}

async function ensureFrameReady(frame: Frame) {
  // Wait so that we know there is an execution context.
  // Assume that if we have an html node we have an execution context.
  await frame.waitForSelector('html');

  // Check if the page is loaded.
  const pageReady = await frame.evaluate(pageIsLoaded);

  if (!pageReady) {
    throw new Error('Page/Frame is not ready');
  }
}

function normalizeContext(
  includes: string[][],
  excludes: string[][]
): Axe.ElementContext | null {
  if (!excludes.length && !includes.length) {
    return null;
  }

  const ctx: Axe.ElementContext = {};
  if (excludes.length) {
    ctx.exclude = excludes;
  }
  if (includes.length) {
    ctx.include = includes;
  }

  return ctx;
}

export class AxePuppeteer {
  private frame: Frame;
  private source?: string;
  private includes: string[][];
  private excludes: string[][];
  private axeOptions: Axe.RunOptions | null;
  private config: Axe.Spec | null;

  constructor(pageFrame: Page | Frame, source?: string) {
    this.frame = getFrame(pageFrame);
    this.source = source;
    this.includes = [];
    this.excludes = [];
    this.axeOptions = null;
    this.config = null;
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

  public options(options: Axe.RunOptions): this {
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

    if (!this.axeOptions) {
      this.axeOptions = {};
    }

    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
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

  public configure(config: Axe.Spec): this {
    // Cast to any because we are asserting for javascript provided argument.
    if (typeof (config as any) !== 'object') {
      throw new Error(
        'AxePuppeteer needs an object to configure. See axe-core configure API.'
      );
    }

    this.config = config;
    return this;
  }

  public async analyze(): Promise<Axe.AxeResults>;
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | null>;
  public async analyze<T extends AnalyzeCB>(
    callback?: T
  ): Promise<Axe.AxeResults | null> {
    try {
      await ensureFrameReady(this.frame);

      await injectAxe(this.frame, this.source);

      const context = normalizeContext(this.includes, this.excludes);
      const axeResults = await this.frame.evaluate(
        runAxe,
        this.config as JSONObject,
        context as JSONObject,
        this.axeOptions as JSONObject
      );

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
}
