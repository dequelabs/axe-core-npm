# axe-core-npm

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

This repository uses [pnpm](https://pnpm.io/installation) as its package manager.
The version you install locally does not need to match the one in `packageManager` — pnpm reads that field and switches itself.

Fetch dependencies and link packages together:

```console
pnpm install
```

Run the linter:

```console
pnpm run lint
```

Run the code formatter:

```console
pnpm run fmt
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
