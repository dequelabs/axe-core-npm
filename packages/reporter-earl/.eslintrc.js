module.exports = {
  overrides: [
    {
      files: 'tests/*.test.ts',
      env: {
        jest: true
      }
    },
    {
      files: '*.ts',
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-debugger': 'off',
        'no-empty-pattern': 'off'
      }
    }
  ]
};
