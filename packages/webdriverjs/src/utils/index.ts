import type { ElementContext } from 'axe-core';

/**
 * Get running context
 * @param {Array} include
 * @param {Array} exclude
 * @returns {(ElementContext | null)}
 */

export const normalizeContext = (
  include: string[],
  exclude: string[]
): ElementContext | null => {
  if (!exclude.length) {
    if (!include.length) {
      return null;
    }
    return {
      include
    };
  }
  if (!include.length) {
    return {
      exclude
    };
  }
  return {
    include,
    exclude
  };
};
