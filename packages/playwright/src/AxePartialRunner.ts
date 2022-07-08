import axe from 'axe-core';
/**
 * This class parallelizes the async calls to axe.runPartial.
 *
 * In this project, most async calls needs to block execution, such as
 * the axeGetFrameContext() and getChildFrame() and calls.
 *
 * Unlike those calls, axe.runPartial() calls must run in parallel, so that
 * frame tests don't wait for each other. This is necessary to minimize the time
 * between when axe-core finds a frame, and when it is tested.
 */

type GetPartialResultsResponse = Parameters<typeof axe.finishRun>[0];
export default class AxePartialRunner {
  private partialPromise: Promise<axe.PartialResult>;
  private childRunners: Array<AxePartialRunner | null> = [];

  constructor(
    partialPromise: Promise<axe.PartialResult>,
    private initiator: boolean = false
  ) {
    this.partialPromise = caught(partialPromise);
  }

  public addChildResults(childResultRunner: AxePartialRunner | null): void {
    this.childRunners.push(childResultRunner);
  }

  public async getPartials(): Promise<GetPartialResultsResponse> {
    try {
      const parentPartial = await this.partialPromise;
      const childPromises = this.childRunners.map(childRunner => {
        return childRunner ? caught(childRunner.getPartials()) : [null];
      });
      const childPartials = (await Promise.all(childPromises)).flat(1);
      return [parentPartial, ...childPartials];
    } catch (e) {
      if (this.initiator) {
        throw e;
      }
      return [null];
    }
  }
}

// Utility to tell NodeJS not to worry about catching promise errors async.
// See: https://stackoverflow.com/questions/40920179/should-i-refrain-from-handling-promise-rejection-asynchronously
export const caught = ((f: () => void) => {
  return <T>(p: Promise<T>): Promise<T> => (p.catch(f), p);
  /* eslint-disable @typescript-eslint/no-empty-function */
})(() => {});
