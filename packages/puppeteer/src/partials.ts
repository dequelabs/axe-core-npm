// This module encapsulates the browser environment
import * as Axe from 'axe-core';
import puppeteer, {
  ElementHandle,
  Frame,
  JSONArray,
  JSONObject
} from 'puppeteer';
import {
  axeGetFrameContext,
  axeRunPartial,
  axeFinishRun,
  axeShadowSelect
} from './browser';

export async function runPartialRecursive(
  frame: Frame,
  context: Axe.ContextObject,
  options: Axe.RunOptions
): Promise<Axe.PartialResult[]> {
  // Have axe-core tell us what frames to test, base on the context:
  await injectJSModule(frame);
  const frameContexts: Axe.FrameContext[] = await frame.evaluate(
    axeGetFrameContext,
    context as JSONObject,
    options as JSONObject
  );

  const promises: Promise<Axe.PartialResult | Axe.PartialResult[]>[] = [];
  // TODO: Not sure if this becomes blocking in the browser.
  // Need to make sure this doesn't hold up findContentFrame calls.
  promises.push(frame.evaluate(axeRunPartial, context, options as JSONObject));

  for (const { frameSelector, frameContext } of frameContexts) {
    const childFrame = await findContentFrame(frame, frameSelector);
    if (!childFrame) {
      // TODO: Handle if the frame can't be found
      // promises.push(null);
      continue;
    }
    promises.push(runPartialRecursive(childFrame, frameContext, options));
  }

  // TODO: Handle if axe-core fails to resolve
  const results = await Promise.all(promises);
  return results.flat();
}

async function findContentFrame(
  frame: Frame,
  frameSelector: Axe.Selector
): Promise<Frame | null> {
  const frameElm: ElementHandle<Element> = await frame.evaluateHandle(
    axeShadowSelect,
    frameSelector
  );
  return frameElm.contentFrame();
}

export async function finishRun(
  frameResults: Axe.PartialResult[],
  options: Axe.RunOptions = {}
): Promise<Axe.AxeResults> {
  const browser = await puppeteer.launch();
  const blankPage = await browser.newPage();

  await injectJSModule(blankPage.mainFrame());
  const axeReport = await blankPage.evaluate(
    axeFinishRun,
    (frameResults as unknown) as JSONArray,
    options as JSONObject
  );
  return axeReport;
}

function injectJSModule(frame: Frame): Promise<void> {
  return frame
    .addScriptTag({
      path: require.resolve('axe-core')
    })
    .then(() => undefined);
}
