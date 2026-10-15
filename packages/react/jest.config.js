module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  moduleNameMapper: {
    // Note: sinon's ESM entry point breaks under jest, so point at the bundle.
    // @see https://github.com/sinonjs/sinon/issues/2522
    sinon: '<rootDir>/node_modules/sinon/pkg/sinon.js'
  }
};
