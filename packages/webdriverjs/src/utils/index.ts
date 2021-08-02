import type { ContextObject } from 'axe-core';

/**
 * Get running context
 */
export const normalizeContext = (
  include: string[],
  exclude: string[]
): ContextObject => {
  if (!exclude.length) {
    if (!include.length) {
      return { exclude: [] };
    }
    return { include };
  }
  if (!include.length) {
    return { exclude };
  }
  return {
    include,
    exclude
  };
};

/**
 * Promise timeout
 */
export function sleep(milliseconds = 10): Promise<void> {
  return new Promise(r => setTimeout(r, milliseconds));
}

// Utility to tell NodeJS not to worry about catching promise errors async.
// See: https://stackoverflow.com/questions/40920179/should-i-refrain-from-handling-promise-rejection-asynchronously
export const caught = (
  f =>
  <T>(p: Promise<T>): Promise<T> =>
    p.catch(f), p
)();
