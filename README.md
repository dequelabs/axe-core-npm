# axe-core-npm

[![CircleCI](https://circleci.com/gh/dequelabs/axe-core-npm.svg?style=svg&circle-token=5bd96056d8ab9f52737de9b5d7cc614decbb9819)](https://circleci.com/gh/dequelabs/axe-core-npm)
[![Join our Slack chat](https://img.shields.io/badge/slack-chat-purple.svg?logo=slack)](https://accessibility.deque.com/axe-community)

This repository contains 7 packages, which can be used for automated accessibility testing powered by [axe core][axe-core].


The packages are listed below:

- [`@axe-core/cli`](./packages/cli/README.md)
- [`@axe-core/playwright`](./packages/playwright/README.md)
- [`@axe-core/puppeteer`](./packages/puppeteer/README.md)
- [`@axe-core/react`](./packages/react/README.md)
- [`@axe-core/reporter-earl`](./packages/reporter-earl/README.md)
- [`@axe-core/webdriverio`](./packages/webdriverio/README.md)
- [`@axe-core/webdriverjs`](./packages/webdriverjs/README.md)

## Development

Fetch dependencies and link packages together:

```console
npm install
npm run bootstrap
```

Run the linter:

```console
npm run lint
```

Run the code formatter:

```console
npm run fmt
```

Please refer to respective README for installation, usage, and configuration notes.

## Philosophy

We believe that automated testing has an important role to play in achieving digital equality and that in order to do that, it must achieve mainstream adoption by professional web developers. That means that the tests must inspire trust, must be fast, must work everywhere and must be available everywhere.

## Manifesto

1. Automated accessibility testing rules must have a zero false positive rate
2. Automated accessibility testing rules must be lightweight and fast
3. Automated accessibility testing rules must work in all modern browsers
4. Automated accessibility testing rules must, themselves, be tested automatically

[axe-core]: https://github.com/dequelabs/axe-core
