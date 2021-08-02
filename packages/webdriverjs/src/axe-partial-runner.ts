import * as axe from 'axe-core';
import { caught } from './utils/index';

export type PartialResults = Parameters<typeof axe.finishRun>[0];

/**
 * This class parallelizes the async calls to axe.runPartial.
 *
 * In this project, most async calls needs to block execution, such as
 * the driver.switchTo().frame() calls. These must run in the correct order
 * to avoid stale element references and infinite loops testing the same frame.
 *
 * Unlike those calls, axe.runPartial() calls must run in parallel, so that
 * frame tests don't wait for each other. This is necessary to minimize the time
 * between when axe-core finds a frame, and when it is tested.
 */
export class AxePartialRunner {
  private partialPromise: Promise<axe.PartialResult>;
  private childRunners: Array<AxePartialRunner | null> = [];

  constructor(
    partialPromise: Promise<axe.PartialResult>,
    private initiator: boolean = false
  ) {
    this.partialPromise = caught(partialPromise);
  }

  public addChildResults(childResultRunner: AxePartialRunner | null) {
    this.childRunners.push(childResultRunner);
  }

  public async getPartials(): Promise<PartialResults> {
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
