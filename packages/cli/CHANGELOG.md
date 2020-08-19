# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 4.0.0 (2020-08-19)


### Bug Fixes

* **cli:** add timeout to `webdriver.js` ([#47](https://github.com/dequelabs/axe-core-npm/issues/47)) ([b9a3a3d](https://github.com/dequelabs/axe-core-npm/commit/b9a3a3d2bd1fc5c8a749dfa78d1b52f77756bca1))
* **cli:** change default mocha timeout for testing ([#18](https://github.com/dequelabs/axe-core-npm/issues/18)) ([f1e770c](https://github.com/dequelabs/axe-core-npm/commit/f1e770c22e2f170eec5757d58cc140818fb6a76b))
* **cli:** Enable program to work with `pkg` ([#48](https://github.com/dequelabs/axe-core-npm/issues/48)) ([a9ccea6](https://github.com/dequelabs/axe-core-npm/commit/a9ccea6cf7f152daa016f5ccc9fa85222ab9bdc0))
* **cli:** fix main in `package.json` so that we can use functions in `axe-test-urls` file ([#26](https://github.com/dequelabs/axe-core-npm/issues/26)) ([651af8f](https://github.com/dequelabs/axe-core-npm/commit/651af8faa2d4e44e49bcb311fc4b4e4d03f70d84))
* **cli:** fix webdriver being passed from index.js ([#33](https://github.com/dequelabs/axe-core-npm/issues/33)) ([7c939d6](https://github.com/dequelabs/axe-core-npm/commit/7c939d667c02d594ef810fefdc9663b6c856cfbc))
* **cli:** start webdriver correctly ([#69](https://github.com/dequelabs/axe-core-npm/issues/69)) ([90675b4](https://github.com/dequelabs/axe-core-npm/commit/90675b47a0d9301dd5578785888e56785c6a442f))
* **webdriverjs:** Require `new` when instantiating ([#31](https://github.com/dequelabs/axe-core-npm/issues/31)) ([c0aa15c](https://github.com/dequelabs/axe-core-npm/commit/c0aa15ca0134f300fa5db4887d73c4e9633af2ca))
* Make packages public ([#23](https://github.com/dequelabs/axe-core-npm/issues/23)) ([56395f0](https://github.com/dequelabs/axe-core-npm/commit/56395f047985f8f81951531de84b79ff8bb33881))


### Features

* update `@axe-core/*` to use axe-core v4.0.1 ([#56](https://github.com/dequelabs/axe-core-npm/issues/56)) ([4b0ea09](https://github.com/dequelabs/axe-core-npm/commit/4b0ea095fe0963640e1e11f53665a66ad775f4df))
* **cli:** replace axe-webdriverjs in favor of @axe-core/webdriverjs ([#51](https://github.com/dequelabs/axe-core-npm/issues/51)) ([734a795](https://github.com/dequelabs/axe-core-npm/commit/734a795c2b7b6478ba9c3586d4489a04244a7011))
* Add `@axe-core/cli` ([#6](https://github.com/dequelabs/axe-core-npm/issues/6)) ([2db54c2](https://github.com/dequelabs/axe-core-npm/commit/2db54c2476a3d5c2a1b3c85da58f90ac077e61e5))


### BREAKING CHANGES

* **webdriverjs:** use `new AxeBuilder()`, not `AxeBuilder()`
