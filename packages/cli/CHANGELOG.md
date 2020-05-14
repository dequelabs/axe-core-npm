# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.2.0](https://github.com/dequelabs/axe-cli/compare/v3.1.1...v3.2.0) (2019-09-30)

### Bug Fixes

- **circleci:** use ([7a8ca66](https://github.com/dequelabs/axe-cli/commit/7a8ca66))

### Features

- **webdriver:** add option ([134b299](https://github.com/dequelabs/axe-cli/commit/134b299))

### [3.1.1](https://github.com/dequelabs/axe-cli/compare/v3.1.0...v3.1.1) (2019-08-20)

### Bug Fixes

- Update Chromedriver dependency [#103](https://github.com/dequelabs/axe-cli/issues/103) [#104](https://github.com/dequelabs/axe-cli/issues/104)

## [3.1.0](https://github.com/dequelabs/axe-cli/compare/v3.0.0...v3.1.0) (2019-07-15)

### Bug Fixes

- correct scope documentation ([#80](https://github.com/dequelabs/axe-cli/issues/80)) ([81b4312](https://github.com/dequelabs/axe-cli/commit/81b4312)), closes [#75](https://github.com/dequelabs/axe-cli/issues/75)

### Features

- add `--chrome-options` flag ([#81](https://github.com/dequelabs/axe-cli/issues/81)) ([6214bcb](https://github.com/dequelabs/axe-cli/commit/6214bcb)), closes [#65](https://github.com/dequelabs/axe-cli/issues/65)
- add `--stdout` flag ([#83](https://github.com/dequelabs/axe-cli/issues/83)) ([06328bf](https://github.com/dequelabs/axe-cli/commit/06328bf)), closes [#15](https://github.com/dequelabs/axe-cli/issues/15)
- add meta data to cli output ([#94](https://github.com/dequelabs/axe-cli/issues/94)) ([7ee59e9](https://github.com/dequelabs/axe-cli/commit/7ee59e9))

### Tests

- make "ready class" test more forgiving ([#74](https://github.com/dequelabs/axe-cli/issues/74)) ([fc2b595](https://github.com/dequelabs/axe-cli/commit/fc2b595))

<a name="3.0.0"></a>

# [3.0.0](https://github.com/dequelabs/axe-cli/compare/v2.1.0-alpha.1...v3.0.0) (2018-03-28)

### Features

- Update to [axe-core 3.0.0](https://github.com/dequelabs/axe-core/releases/tag/v3.0.0)
- Add --load-delay option to delay audit after page loads ([#53](https://github.com/dequelabs/axe-cli/issues/53)) ([c0659a8](https://github.com/dequelabs/axe-cli/commit/c0659a8))
- Upgrade chromedriver to support Chrome 65 ([e4d4bd1](https://github.com/dequelabs/axe-cli/commit/e4d4bd1))

<a name="2.1.0-alpha.1"></a>

# [2.1.0-alpha.1](https://github.com/dequelabs/axe-cli/compare/v2.1.0-alpha.0...v2.1.0-alpha.1) (2018-02-21)

### Features

- Support aXe-core 3.0 Shadow DOM selectors ([#49](https://github.com/dequelabs/axe-cli/issues/49)) ([790b421](https://github.com/dequelabs/axe-cli/commit/790b421))

<a name="2.1.0-alpha.0"></a>

# [2.1.0-alpha.0](https://github.com/dequelabs/axe-cli/compare/v2.0.0...v2.1.0-alpha.0) (2018-02-20)

### Bug Fixes

- Security vulnerability in hoek package ([#50](https://github.com/dequelabs/axe-cli/issues/50)) ([81695ad](https://github.com/dequelabs/axe-cli/commit/81695ad))

### Features

- Upgrade axe-core to 3.0.0-beta.1
- Upgrade axe-webdriverjs to 2.0.0-alpha.1

<a name="2.0.0"></a>

## [2.0.0](https://github.com/dequelabs/axe-cli/compare/v1.3.1...v2.0.0) (2017-12-19)

### Features

- Use chrome-headless as default browser replacing PhantomJS ([1ae8e12](https://github.com/dequelabs/axe-cli/commit/1ae8e12))

### BREAKING CHANGES

- PhantomJS is no longer maintained. We will be
  replacing it with headless Chrome

<a name="1.3.1"></a>

## [1.3.1](https://github.com/dequelabs/axe-cli/compare/v1.3.0...v1.3.1) (2017-12-19)

### Features

- Add axe-core 2.6.0

<a name="1.3.0"></a>

# [1.3.0](https://github.com/dequelabs/axe-cli/compare/v1.1.1...v1.3.0) (2017-11-17)

### Bug Fixes

- package.json & .snyk to reduce vulnerabilities ([#39](https://github.com/dequelabs/axe-cli/issues/39)) ([9b20eef](https://github.com/dequelabs/axe-cli/commit/9b20eef))

### Features

- Add flag that enables supplying a list of rules to be skipped during the analysis ([d22903d](https://github.com/dequelabs/axe-cli/commit/d22903d))
- Allow running from file:// and ftp(s):// ([#41](https://github.com/dequelabs/axe-cli/issues/41)) ([aa3d937](https://github.com/dequelabs/axe-cli/commit/aa3d937))
- Link to DeqeuU courses/testingmethods ([#38](https://github.com/dequelabs/axe-cli/issues/38)) ([8c0e661](https://github.com/dequelabs/axe-cli/commit/8c0e661))

<a name="1.2.0"></a>

# [1.2.0](https://github.com/dequelabs/axe-cli/compare/1.0.2...1.2.0) (2017-10-31)

### Features

- Allow running from file:// and ftp(s):// ([#41](https://github.com/dequelabs/axe-cli/issues/41)) ([aa3d937](https://github.com/dequelabs/axe-cli/commit/aa3d937))
- Link to DeqeuU courses/testingmethods ([#38](https://github.com/dequelabs/axe-cli/issues/38)) ([8c0e661](https://github.com/dequelabs/axe-cli/commit/8c0e661))
- support exit codes ([e14e2d5](https://github.com/dequelabs/axe-cli/commit/e14e2d5)), closes [#20](https://github.com/dequelabs/axe-cli/issues/20) [#22](https://github.com/dequelabs/axe-cli/issues/22)

<a name="1.1.1"></a>

## [1.1.1](https://github.com/dequelabs/axe-cli/compare/1.0.3...1.1.1) (2017-09-20)

### New Features

- feat: Add --timeout and --timer options ([6d4d14f](https://github.com/dequelabs/axe-cli/commit/6d4d14f80e63bef2d54b3704a818a8ca8b1bb0e3))
- chore: upgrade axe-core to 2.4.1, axe-webdriverjs to 1.1.5 ([933f1fd](https://github.com/dequelabs/axe-cli/commit/933f1fdb60b06c6fbbcf6d77763dd334d4df8d73))

### Bug Fixes

- doc: Changed non-working promo url for courses to use a working url ([ca7361e](https://github.com/dequelabs/axe-cli/commit/ca7361e653ccb8f3a0138d0dc5f800ff09136351))

<a name="1.0.3"></a>

## [1.0.3](https://github.com/dequelabs/axe-cli/compare/1.0.2...1.0.3) (2017-07-05)

### New Features

- chore: update axe/webdriverjs to 2.3.1 ([c16bc2f](https://github.com/dequelabs/axe-cli/commit/c16bc2f48f60fbdc556c983db396794cad083a71))
- feat: support exit codes ([e14e2d5](https://github.com/dequelabs/axe-cli/commit/e14e2d503fc52e6ca38378dd865f8948ed1f9d88))

<a name="1.0.2"></a>

## [1.0.2](https://github.com/dequelabs/axe-cli/compare/043d0a4...1.0.2) (2017-05-06)

### Bug Fixes

- add correct Selenium server URL ([043d0a4](https://github.com/dequelabs/axe-cli/commit/043d0a4))
- add node version restriction ([#14](https://github.com/dequelabs/axe-cli/issues/14)) ([b9ff463](https://github.com/dequelabs/axe-cli/commit/b9ff463))
- handle phantomjs and selenium without errors ([afedd67](https://github.com/dequelabs/axe-cli/commit/afedd67))
- remove extraneous driver kill ([870f6de](https://github.com/dequelabs/axe-cli/commit/870f6de))
