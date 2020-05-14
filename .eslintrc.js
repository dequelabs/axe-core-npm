module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:react/recommended'
  ],
  rules: {
    '@typescript-eslint/camelcase': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    node: true,
    browser: true
  }
};
