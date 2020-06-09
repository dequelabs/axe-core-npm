import axe from 'axe-core';

/**
 * Normalizes context parameter with includes and excludes
 *
 * @param include Selectors to include
 * @param exclude Selectors to exclude
 */

const normalizeContext = (
  include: string[] | string[][],
  exclude: string[] | string[][]
): axe.ContextObject | null => {
  if (!exclude.length) {
    if (!include.length) {
      return null;
    }

    return { include };
  }

  if (!include.length) {
    return { exclude };
  }

  return { include, exclude };
};

export default normalizeContext;
