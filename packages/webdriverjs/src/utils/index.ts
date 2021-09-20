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
