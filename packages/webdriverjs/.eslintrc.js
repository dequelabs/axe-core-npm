module.exports = {
  overrides: [
    {
      files: 'src/test/**/*.ts',
      env: {
        mocha: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};
