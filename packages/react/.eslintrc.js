module.exports = {
  rules: {
    'react/prop-types': 'off',
    'react/no-find-dom-node': 'off'
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
