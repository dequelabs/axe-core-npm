module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-debugger': 'off',
    'no-empty-pattern': 'off'
  },
  overrides: [
    {
      files: 'tests/*.test.ts',
      env: {
        jest: true
      }
    }
  ]
};
