module.exports = {
  rules: {
    '@typescript-eslint/no-empty-function': 0
  },
  overrides: [
    {
      files: 'test/**/*.js',
      env: {
        mocha: true
      }
    }
  ]
};
