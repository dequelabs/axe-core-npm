import type { ContextObject } from 'axe-core';
import { Selector } from '../types';

/**
 * Get running context
 */
export const normalizeContext = (
  include: Selector[],
  exclude: Selector[]
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
