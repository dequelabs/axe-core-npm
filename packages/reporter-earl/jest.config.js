module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '\\.(ts|tsx)$': 'ts-jest'
  },
  testRegex: '/tests/.*\\.(ts|tsx|js)$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/utils.ts'],
  silent: false,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
