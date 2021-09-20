import * as fs from 'fs';
import { Frame, ElementHandle } from 'puppeteer';

interface IInjectAxeArgs {
  source?: string | Function;
  selector: string;
  logOnError?: boolean;
  args?: any[];
}

export async function injectJS(
  frame: Frame | undefined,
  { source, selector, logOnError, args }: IInjectAxeArgs
): Promise<void> {
  if (!frame) {
    return;
  }
  const frames = await frame.$$(selector);
  const injections = [];
  for (const frameElement of frames) {
    const subFrame = await frameElement.contentFrame();
    const p = injectJS(subFrame as Frame, {
      source,
      selector,
      args,
      logOnError: true
    });
    injections.push(p);
  }

  const reportError = (): void => {
    // tslint:disable-next-line:no-console
    console.error(`Failed to inject axe-core into frame (${frame.url()})`);
  };

  let injectP: Promise<ElementHandle<Element> | void>;
  if (!source) {
    injectP = injectJSModule(frame);
  } else {
    injectP = injectJSSource(frame, source, args);
  }

  if (logOnError) {
    // Just print diagnostic if a child frame fails to load.
    // Don't fully error since we aren't the top-level frame
    injectP = injectP.catch(reportError);
  }

  injections.push(injectP);
  // Fix return type since we don't care about the value
  return Promise.all(injections).then(() => undefined);
}

async function injectJSModule(frame: Frame): Promise<void> {
  const source = fs.readFileSync(require.resolve('axe-core'), 'utf8');
  await injectJSSource(frame, source);
}

function injectJSSource(
  frame: Frame,
  source: string | Function,
  args: any[] = []
): Promise<void> {
  return frame.evaluate(source as any, ...args);
}

export function iframeSelector(disabledFrameSelectors: string[]): string {
  let selector = 'iframe';
  for (const disabledFrameSelector of disabledFrameSelectors) {
    selector += `:not(${disabledFrameSelector})`;
  }
  return selector;
}
