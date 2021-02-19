module.exports = {
  rules: {
    '@typescript-eslint/no-var-requires': 'off'
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
