module.exports = {
  overrides: [
    {
      files: 'tests/**/*.js',
      env: {
        jest: true
      }
    },
    {
      files: '*.js',
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        'prefer-spread': 'off',
        'prefer-rest-params': 'off'
      }
    }
  ]
};
