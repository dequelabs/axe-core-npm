const globals = require('globals');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const eslintPluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  eslint.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.browser
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      prettier: eslintPluginPrettier,
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error'
    }
  },
  {
    ignores: [
      'packages/cli/src/testutils/',
      'packages/cli/src/**/**/*.test.ts',
      'packages/reporter-earl/coverage/',
      'packages/react/examples/',
      '**/dist/',
      '**/fixtures/external/'
    ]
  },
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },
  {
    files: ['packages/cli/**'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  {
    files: ['packages/cli/**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['packages/puppeteer/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': 'off'
    }
  },
  {
    files: ['packages/react/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.browser
      },
      ecmaVersion: 2018
    }
  },
  {
    files: ['packages/react/test/*.js'],
    rules: {
      'no-var': 'off'
    }
  },
  {
    files: ['packages/reporter-earl/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-debugger': 'off',
      'no-empty-pattern': 'off'
    }
  },
  {
    files: ['packages/reporter-earl/tests/*.test.ts'],
    languageOptions: {
      globals: {
        jest: true
      }
    }
  },
  {
    files: ['packages/reporter-earl/src/types.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  }
];
