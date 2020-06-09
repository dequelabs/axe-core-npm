const AxeBuilder = require('./AxeBuilder').default;

// Factory function to enable creating an `AxeBuilder` without the `new` keyword.
// TODO: Remove this in the next major version
const createAxeBuilder = (...args) => {
  return new AxeBuilder(...args);
};

// Expose the factory function both as `module.exports` and `exports.default` for backwards compatbility.
// TODO: Remove this in the next major version
exports = module.exports = createAxeBuilder;

// TypeScript/ES6 module support (see #74).
exports.default = createAxeBuilder;
