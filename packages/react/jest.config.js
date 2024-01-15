module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  moduleNameMapper: {
    // Note: the '../../' is required as we're targeting the root `node_modules`
    // @see https://github.com/sinonjs/sinon/issues/2522
    sinon: '<rootDir>/../../node_modules/sinon/pkg/sinon.js'
  }
};
