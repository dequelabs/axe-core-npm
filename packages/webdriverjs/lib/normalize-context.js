/**
 * Normalizes context parameter with includes and excludes
 * @private
 * @param  {Array} include Array of selectors to include
 * @param  {Array} exclude Array of selectors to exclude
 * @return {Object}
 */
exports = module.exports = function(include, exclude) {
  if (!exclude.length) {
    if (!include.length) {
      return null;
    }

    return {
      include: include
    };
  }

  if (!include.length) {
    return {
      exclude: exclude
    };
  }

  return {
    include: include,
    exclude: exclude
  };
};
