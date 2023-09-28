import type { SerialContextObject, SerialSelectorList } from 'axe-core';

/**
 * Get running context
 */
export const normalizeContext = (
  include: SerialSelectorList,
  exclude: SerialSelectorList
): SerialContextObject => {
  const base: SerialContextObject = {
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
