# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.1.0](https://github.com/dequelabs/axe-core-npm/compare/v4.0.0...v4.1.0) (2020-11-20)

**Note:** Version bump only for package @axe-core/webdriverjs

# 4.0.0 (2020-08-25)

### Bug Fixes

- **webdriverjs:** Enable library to work in `pkg`ed programs ([#49](https://github.com/dequelabs/axe-core-npm/issues/49)) ([e073487](https://github.com/dequelabs/axe-core-npm/commit/e0734879ad83ab3621269d54ed038983c51fbc03))
- **webdriverjs:** Remove deprecated "error-less" callback ([#27](https://github.com/dequelabs/axe-core-npm/issues/27)) ([7218bf6](https://github.com/dequelabs/axe-core-npm/commit/7218bf683e354257cbee79ba20a2ce0089e5c541))
- **webdriverjs:** Require `new` when instantiating ([#31](https://github.com/dequelabs/axe-core-npm/issues/31)) ([c0aa15c](https://github.com/dequelabs/axe-core-npm/commit/c0aa15ca0134f300fa5db4887d73c4e9633af2ca))
- Make packages public ([#23](https://github.com/dequelabs/axe-core-npm/issues/23)) ([56395f0](https://github.com/dequelabs/axe-core-npm/commit/56395f047985f8f81951531de84b79ff8bb33881))

### Features

- update `@axe-core/*` to use axe-core v4.0.1 ([#56](https://github.com/dequelabs/axe-core-npm/issues/56)) ([4b0ea09](https://github.com/dequelabs/axe-core-npm/commit/4b0ea095fe0963640e1e11f53665a66ad775f4df))
- **cli:** replace axe-webdriverjs in favor of @axe-core/webdriverjs ([#51](https://github.com/dequelabs/axe-core-npm/issues/51)) ([734a795](https://github.com/dequelabs/axe-core-npm/commit/734a795c2b7b6478ba9c3586d4489a04244a7011))
- add `@axe-core/webdriverjs` ([#11](https://github.com/dequelabs/axe-core-npm/issues/11)) ([b1c4940](https://github.com/dequelabs/axe-core-npm/commit/b1c4940443985ac7c30ac2afc73d9440323f78e1))

### BREAKING CHANGES

- **webdriverjs:** use `new AxeBuilder()`, not `AxeBuilder()`
- **webdriverjs:** you must handle errors
