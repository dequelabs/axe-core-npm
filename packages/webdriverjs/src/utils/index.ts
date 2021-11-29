import type { ContextObject } from 'axe-core';

/**
 * Get running context
 */
export const normalizeContext = (
  include: string[][],
  exclude: string[][]
): ContextObject => {
  const base: ContextObject = {
    exclude: []
  };
  if (exclude.length && Array.isArray(base.exclude)) {
    base.exclude.push(...exclude);
  }
  if (include.length) {
    base.include = include;
  }
  return base;
};
