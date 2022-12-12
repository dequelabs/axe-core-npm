import type { ContextObject, SerialSelectorList } from 'axe-core';

/**
 * Get running context
 */
export const normalizeContext = (
  include: SerialSelectorList,
  exclude: SerialSelectorList
): ContextObject => {
  const base: ContextObject = {
    exclude: [],
    include: []
  };
  if (exclude.length && Array.isArray(base.exclude)) {
    base.exclude.push(...exclude);
  }
  if (include.length) {
    base.include = include;
  }
  return base;
};
