module.exports = {
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react/prop-types': 'off',
    'react/no-find-dom-node': 'off',
    'no-undef': 'off'
  },
  env: {
    browser: true,
    node: true,
    mocha: true
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018
  },
  overrides: [
    {
      files: 'test/*.js',
      rules: {
        'no-var': 'off'
      }
    }
  ]
};
