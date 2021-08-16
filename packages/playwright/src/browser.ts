/* istanbul ignore file */
import type {
  GetFrameContextsParams,
  RunPartialParams,
  FinishRunParams,
  ShadowSelectParams
} from './types';
import { FrameContext, AxeResults, PartialResult } from 'axe-core';
import * as axeCore from 'axe-core';

// Expect axe to be set up.
// Tell Typescript that there should be a global variable called `axe` that follows
// the shape given by the `axe-core` typings (the `run` and `configure` functions).
declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    axe: typeof axeCore;
  }
}
export const getFrameContexts = ({
  context
}: GetFrameContextsParams): FrameContext[] => {
  return window.axe.utils.getFrameContexts(context);
};

export const shadowSelect = ({
  frameSelector
}: ShadowSelectParams): Element | null => {
  return window.axe.utils.shadowSelect(frameSelector);
};

export const runPartial = ({
  context,
  options
}: RunPartialParams): Promise<PartialResult> => {
  return window.axe.runPartial(context, options);
};

export const finishRun = ({
  partialResults,
  options
}: FinishRunParams): Promise<AxeResults> => {
  return window.axe.finishRun(partialResults, options);
};
