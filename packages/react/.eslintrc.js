module.exports = {
  rules: {
    'react/no-find-dom-node': 'off',
    'react/prop-types': 'off'
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
