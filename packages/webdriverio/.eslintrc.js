module.exports = {
  rules: {
    '@typescript-eslint/no-empty-function': 'off',
    'prefer-spread': 'off',
    'prefer-rest-params': 'off'
  },
  overrides: [
    {
      files: 'tests/**/*.js',
      env: {
        jest: true
      }
    }
  ]
};
