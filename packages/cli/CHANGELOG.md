# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.2.2](https://github.com/dequelabs/axe-core-npm/compare/v4.2.0...v4.2.2) (2021-06-23)

### Bug Fixes

- pass chrome options to `chromeOptions.addArguments()` ([#262](https://github.com/dequelabs/axe-core-npm/issues/262)) ([715f463](https://github.com/dequelabs/axe-core-npm/commit/715f463c1324d11cafec4a357ee55f446584cd1c))
- selenium-webdriverjs peer dependency to allow newer versions ([#258](https://github.com/dequelabs/axe-core-npm/issues/258)) ([2dc2788](https://github.com/dequelabs/axe-core-npm/commit/2dc27883aa4aa40e64766b0bc60191cb1a4f8963))
- update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
- **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))

### Features

- update `axe-core@4.2.2` ([#263](https://github.com/dequelabs/axe-core-npm/issues/263)) ([8c609e1](https://github.com/dequelabs/axe-core-npm/commit/8c609e1e3580a63f8697ca94e146b0e2ed28e579))
- update to use `axe-core@4.2.3` ([#280](https://github.com/dequelabs/axe-core-npm/issues/280)) ([8aebba5](https://github.com/dequelabs/axe-core-npm/commit/8aebba5c6069ca047f649446e072259c069c9a22))

## [4.2.1](https://github.com/dequelabs/axe-core-npm/compare/v4.2.0...v4.2.1) (2021-05-19)

### Bug Fixes

- update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
- **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))

# [4.2.0](https://github.com/dequelabs/axe-core-npm/compare/v4.1.1...v4.2.0) (2021-05-05)

### Bug Fixes

- **cli:** add `endTimer()` for page load timer ([#236](https://github.com/dequelabs/axe-core-npm/issues/236)) ([e0a19a3](https://github.com/dequelabs/axe-core-npm/commit/e0a19a3bad9b9965df9b98f391efb3403ab737ae))
- **cli:** find axe-core when installed globally ([#232](https://github.com/dequelabs/axe-core-npm/issues/232)) ([75c273d](https://github.com/dequelabs/axe-core-npm/commit/75c273d6b8b4dcec1f953605a5bf4c9b818436cb))

### Features

- update axe-core to 4.2.0 ([#240](https://github.com/dequelabs/axe-core-npm/issues/240)) ([4e8f7fe](https://github.com/dequelabs/axe-core-npm/commit/4e8f7fee9db09fb56f91ea34f9984be66a29033e))

## [4.1.1](https://github.com/dequelabs/axe-core-npm/compare/v4.0.0...v4.1.1) (2021-01-28)

### Bug Fixes

- **cli:** create a directory when one does not exist ([#187](https://github.com/dequelabs/axe-core-npm/issues/187)) ([814cabf](https://github.com/dequelabs/axe-core-npm/commit/814cabf1082a758940b0a7917a1993fdd1d013af))
- **react:** Prevent config TypeError ([708c463](https://github.com/dequelabs/axe-core-npm/commit/708c46366d5f2069a4f25238beb32299abc962b9))

# [4.1.0](https://github.com/dequelabs/axe-core-npm/compare/v4.0.0...v4.1.0) (2020-11-20)

**Note:** Version bump only for package @axe-core/cli

# 4.0.0 (2020-08-25)

### Bug Fixes

- **cli:** add timeout to `webdriver.js` ([#47](https://github.com/dequelabs/axe-core-npm/issues/47)) ([b9a3a3d](https://github.com/dequelabs/axe-core-npm/commit/b9a3a3d2bd1fc5c8a749dfa78d1b52f77756bca1))
- **cli:** change default mocha timeout for testing ([#18](https://github.com/dequelabs/axe-core-npm/issues/18)) ([f1e770c](https://github.com/dequelabs/axe-core-npm/commit/f1e770c22e2f170eec5757d58cc140818fb6a76b))
- **cli:** Enable program to work with `pkg` ([#48](https://github.com/dequelabs/axe-core-npm/issues/48)) ([a9ccea6](https://github.com/dequelabs/axe-core-npm/commit/a9ccea6cf7f152daa016f5ccc9fa85222ab9bdc0))
- **cli:** fix main in `package.json` so that we can use functions in `axe-test-urls` file ([#26](https://github.com/dequelabs/axe-core-npm/issues/26)) ([651af8f](https://github.com/dequelabs/axe-core-npm/commit/651af8faa2d4e44e49bcb311fc4b4e4d03f70d84))
- **cli:** fix webdriver being passed from index.js ([#33](https://github.com/dequelabs/axe-core-npm/issues/33)) ([7c939d6](https://github.com/dequelabs/axe-core-npm/commit/7c939d667c02d594ef810fefdc9663b6c856cfbc))
- **cli:** start webdriver correctly ([#69](https://github.com/dequelabs/axe-core-npm/issues/69)) ([90675b4](https://github.com/dequelabs/axe-core-npm/commit/90675b47a0d9301dd5578785888e56785c6a442f))
- **webdriverjs:** Require `new` when instantiating ([#31](https://github.com/dequelabs/axe-core-npm/issues/31)) ([c0aa15c](https://github.com/dequelabs/axe-core-npm/commit/c0aa15ca0134f300fa5db4887d73c4e9633af2ca))
- Make packages public ([#23](https://github.com/dequelabs/axe-core-npm/issues/23)) ([56395f0](https://github.com/dequelabs/axe-core-npm/commit/56395f047985f8f81951531de84b79ff8bb33881))

### Features

- update `@axe-core/*` to use axe-core v4.0.1 ([#56](https://github.com/dequelabs/axe-core-npm/issues/56)) ([4b0ea09](https://github.com/dequelabs/axe-core-npm/commit/4b0ea095fe0963640e1e11f53665a66ad775f4df))
- **cli:** replace axe-webdriverjs in favor of @axe-core/webdriverjs ([#51](https://github.com/dequelabs/axe-core-npm/issues/51)) ([734a795](https://github.com/dequelabs/axe-core-npm/commit/734a795c2b7b6478ba9c3586d4489a04244a7011))
- Add `@axe-core/cli` ([#6](https://github.com/dequelabs/axe-core-npm/issues/6)) ([2db54c2](https://github.com/dequelabs/axe-core-npm/commit/2db54c2476a3d5c2a1b3c85da58f90ac077e61e5))

### BREAKING CHANGES

- **webdriverjs:** use `new AxeBuilder()`, not `AxeBuilder()`
