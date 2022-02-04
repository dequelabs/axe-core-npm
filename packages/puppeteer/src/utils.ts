import * as fs from 'fs';
import * as Axe from 'axe-core';
import { Frame, JSONObject } from 'puppeteer';
import { axeConfigure, axeShadowSelect } from './browser';
import { pageIsLoaded } from './browser';

export async function frameSourceInject(
  frame: Frame,
  source: string | undefined,
  config: Axe.Spec | null
): Promise<void> {
  await assertFrameReady(frame);
  if (!source) {
    const pathFile = require.resolve('axe-core');
    source = fs.readFileSync(pathFile, 'utf8');
  }
  await frame.evaluate(source);
  await frame.evaluate(axeConfigure, config as JSONObject);
}

export function arrayify<T>(src: T | T[]): T[] {
  if (!Array.isArray(src)) {
    return [src];
  }
  return src;
}

export function normalizeContext(
  includes: string[][],
  excludes: string[][],
  disabledFrameSelectors: string[]
): Axe.SerialContextObject {
  const base: Axe.SerialContextObject = {
    exclude: []
  };
  if (excludes.length && Array.isArray(base.exclude)) {
    base.exclude.push(...excludes);
  }
  if (disabledFrameSelectors.length && Array.isArray(base.exclude)) {
    const frameExcludes = disabledFrameSelectors.map(frame => [frame, '*']);
    base.exclude.push(...frameExcludes);
  }
  if (includes.length) {
    base.include = includes;
  }
  return base;
}

export async function getChildFrame(
  frame: Frame,
  childSelector: Axe.CrossTreeSelector
): Promise<Frame | null> {
  const frameElm = await frame.evaluateHandle(axeShadowSelect, childSelector);
  return (await frameElm.asElement()?.contentFrame()) || null;
}

export async function assertFrameReady(frame: Frame): Promise<void> {
  // Wait so that we know there is an execution context.
  // Assume that if we have an html node we have an execution context.
  // Check if the page is loaded.
  let pageReady = false;
  try {
    pageReady = await frame.evaluate(pageIsLoaded);
  } catch {
    /* ignore */
  }
  if (!pageReady) {
    throw new Error('Page/Frame is not ready');
  }
}
