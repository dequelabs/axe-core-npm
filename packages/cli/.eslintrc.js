module.exports = {
  rules: {
    '@typescript-eslint/no-var-requires': 0,
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
