# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.2.0](https://github.com/dequelabs/axe-core-npm/compare/v4.1.1...v4.2.0) (2021-05-05)

### Bug Fixes

- **cli:** add `endTimer()` for page load timer ([#236](https://github.com/dequelabs/axe-core-npm/issues/236)) ([e0a19a3](https://github.com/dequelabs/axe-core-npm/commit/e0a19a3bad9b9965df9b98f391efb3403ab737ae))
- **cli:** find axe-core when installed globally ([#232](https://github.com/dequelabs/axe-core-npm/issues/232)) ([75c273d](https://github.com/dequelabs/axe-core-npm/commit/75c273d6b8b4dcec1f953605a5bf4c9b818436cb))
- **webdriverio:** inject axe-core branding into all iframes ([#231](https://github.com/dequelabs/axe-core-npm/issues/231)) ([3f41c27](https://github.com/dequelabs/axe-core-npm/commit/3f41c2709114b894976bcdf03ca2b3d7f824fcae))
- **webdriverio:** Recursively find <frame> ([#238](https://github.com/dequelabs/axe-core-npm/issues/238)) ([7e6a80d](https://github.com/dequelabs/axe-core-npm/commit/7e6a80d856118cceae598de5f91592d6e6c4dc39))
- **webdriverjs:** Recursively find <frame> ([#209](https://github.com/dequelabs/axe-core-npm/issues/209)) ([0d20e1f](https://github.com/dequelabs/axe-core-npm/commit/0d20e1f3238ca70ccb528867fb1456487c02d0df))

### Features

- **puppeteer:** support puppeteer v9 ([#242](https://github.com/dequelabs/axe-core-npm/issues/242)) ([753a919](https://github.com/dequelabs/axe-core-npm/commit/753a91957c5008908e8b09421e01687bdb445967))
- update axe-core to 4.2.0 ([#240](https://github.com/dequelabs/axe-core-npm/issues/240)) ([4e8f7fe](https://github.com/dequelabs/axe-core-npm/commit/4e8f7fee9db09fb56f91ea34f9984be66a29033e))

## [4.1.1](http://dequelabs/axe-core-npm/compare/v4.0.0...v4.1.1) (2021-01-28)

### Bug Fixes

- **cli:** create a directory when one does not exist ([#187](http://dequelabs/axe-core-npm/issues/187)) ([814cabf](http://dequelabs/axe-core-npm/commits/814cabf1082a758940b0a7917a1993fdd1d013af))
- **react:** Add example using Next.js ([#109](http://dequelabs/axe-core-npm/issues/109)) ([bd009d9](http://dequelabs/axe-core-npm/commits/bd009d9578d9b2704e258ade932fdbbe0a7a571a)), closes [#103](http://dequelabs/axe-core-npm/issues/103)
- **react:** handle undefined config ([#183](http://dequelabs/axe-core-npm/issues/183)) ([6326e13](http://dequelabs/axe-core-npm/commits/6326e131bf62968d5a8180595c1b0b049844ca05))
- **react:** Prevent config TypeError ([708c463](http://dequelabs/axe-core-npm/commits/708c46366d5f2069a4f25238beb32299abc962b9))

### Features

- **react:** add support for runOnly. ([#101](http://dequelabs/axe-core-npm/issues/101)) ([cfadde3](http://dequelabs/axe-core-npm/commits/cfadde3eebf74d26e0fb3768b84e953e92f0bf99))

# [4.1.0](https://github.com/dequelabs/axe-core-npm/compare/v4.0.0...v4.1.0) (2020-11-20)

## Bug Fixes

- **react:** Add example using Next.js ([#109](https://github.com/dequelabs/axe-core-npm/issues/109)) ([bd009d9](https://github.com/dequelabs/axe-core-npm/commit/bd009d9578d9b2704e258ade932fdbbe0a7a571a)), closes [#103](https://github.com/dequelabs/axe-core-npm/issues/103)

## Features

- **react:** add support for runOnly. ([#101](https://github.com/dequelabs/axe-core-npm/issues/101)) ([cfadde3](https://github.com/dequelabs/axe-core-npm/commit/cfadde3eebf74d26e0fb3768b84e953e92f0bf99))

# 4.0.0 (2020-08-25)

### Bug Fixes

- **cli:** add timeout to `webdriver.js` ([#47](https://github.com/dequelabs/axe-core-npm/issues/47)) ([b9a3a3d](https://github.com/dequelabs/axe-core-npm/commit/b9a3a3d2bd1fc5c8a749dfa78d1b52f77756bca1))
- **cli:** change default mocha timeout for testing ([#18](https://github.com/dequelabs/axe-core-npm/issues/18)) ([f1e770c](https://github.com/dequelabs/axe-core-npm/commit/f1e770c22e2f170eec5757d58cc140818fb6a76b))
- **cli:** Enable program to work with `pkg` ([#48](https://github.com/dequelabs/axe-core-npm/issues/48)) ([a9ccea6](https://github.com/dequelabs/axe-core-npm/commit/a9ccea6cf7f152daa016f5ccc9fa85222ab9bdc0))
- **cli:** fix main in `package.json` so that we can use functions in `axe-test-urls` file ([#26](https://github.com/dequelabs/axe-core-npm/issues/26)) ([651af8f](https://github.com/dequelabs/axe-core-npm/commit/651af8faa2d4e44e49bcb311fc4b4e4d03f70d84))
- **cli:** fix webdriver being passed from index.js ([#33](https://github.com/dequelabs/axe-core-npm/issues/33)) ([7c939d6](https://github.com/dequelabs/axe-core-npm/commit/7c939d667c02d594ef810fefdc9663b6c856cfbc))
- **cli:** start webdriver correctly ([#69](https://github.com/dequelabs/axe-core-npm/issues/69)) ([90675b4](https://github.com/dequelabs/axe-core-npm/commit/90675b47a0d9301dd5578785888e56785c6a442f))
- **puppeteer:** check to see if frame exist before injecting JS ([#77](https://github.com/dequelabs/axe-core-npm/issues/77)) ([9847f39](https://github.com/dequelabs/axe-core-npm/commit/9847f39fef0946f4daf60b5e1d6f6b86e6dd8a2a))
- **puppeteer:** fix the spelling of puppeteer in package file ([#59](https://github.com/dequelabs/axe-core-npm/issues/59)) ([8048bf2](https://github.com/dequelabs/axe-core-npm/commit/8048bf2bf2fe71040f1d1da2f83e77eea9ee2d23))
- **puppeteer:** get results from iframes with branding ([#55](https://github.com/dequelabs/axe-core-npm/issues/55)) ([7e71380](https://github.com/dequelabs/axe-core-npm/commit/7e713802a2cdb8d8b9fa5b237066dab1d8f1b506))
- **puppeteer:** get results from within iframes ([#42](https://github.com/dequelabs/axe-core-npm/issues/42)) ([4c4ef7a](https://github.com/dequelabs/axe-core-npm/commit/4c4ef7af29e3d39c8bcb7704dedff035add854a4))
- **webdriverjs:** Enable library to work in `pkg`ed programs ([#49](https://github.com/dequelabs/axe-core-npm/issues/49)) ([e073487](https://github.com/dequelabs/axe-core-npm/commit/e0734879ad83ab3621269d54ed038983c51fbc03))
- **webdriverjs:** Remove deprecated "error-less" callback ([#27](https://github.com/dequelabs/axe-core-npm/issues/27)) ([7218bf6](https://github.com/dequelabs/axe-core-npm/commit/7218bf683e354257cbee79ba20a2ce0089e5c541))
- **webdriverjs:** Require `new` when instantiating ([#31](https://github.com/dequelabs/axe-core-npm/issues/31)) ([c0aa15c](https://github.com/dequelabs/axe-core-npm/commit/c0aa15ca0134f300fa5db4887d73c4e9633af2ca))
- Make packages public ([#23](https://github.com/dequelabs/axe-core-npm/issues/23)) ([56395f0](https://github.com/dequelabs/axe-core-npm/commit/56395f047985f8f81951531de84b79ff8bb33881))

### Features

- add `@axe-core/react` ([#53](https://github.com/dequelabs/axe-core-npm/issues/53)) ([ea3b15a](https://github.com/dequelabs/axe-core-npm/commit/ea3b15ad45c7ad256a88047fb797a074f3256550))
- update `@axe-core/*` to use axe-core v4.0.1 ([#56](https://github.com/dequelabs/axe-core-npm/issues/56)) ([4b0ea09](https://github.com/dequelabs/axe-core-npm/commit/4b0ea095fe0963640e1e11f53665a66ad775f4df))
- **cli:** replace axe-webdriverjs in favor of @axe-core/webdriverjs ([#51](https://github.com/dequelabs/axe-core-npm/issues/51)) ([734a795](https://github.com/dequelabs/axe-core-npm/commit/734a795c2b7b6478ba9c3586d4489a04244a7011))
- Add `@axe-core/cli` ([#6](https://github.com/dequelabs/axe-core-npm/issues/6)) ([2db54c2](https://github.com/dequelabs/axe-core-npm/commit/2db54c2476a3d5c2a1b3c85da58f90ac077e61e5))
- add `@axe-core/puppeteer` ([#7](https://github.com/dequelabs/axe-core-npm/issues/7)) ([0518feb](https://github.com/dequelabs/axe-core-npm/commit/0518febfe341bf8f78125684cc3b229f3f3a718a))
- add `@axe-core/reporter-earl` ([#16](https://github.com/dequelabs/axe-core-npm/issues/16)) ([7f77253](https://github.com/dequelabs/axe-core-npm/commit/7f7725314a07c0e870aa4380fc48978eac980a5b))
- add `@axe-core/webdriverio` ([#15](https://github.com/dequelabs/axe-core-npm/issues/15)) ([d44289e](https://github.com/dequelabs/axe-core-npm/commit/d44289ed4fe84776ec8b336c44b613e6bc625996))
- add `@axe-core/webdriverjs` ([#11](https://github.com/dequelabs/axe-core-npm/issues/11)) ([b1c4940](https://github.com/dequelabs/axe-core-npm/commit/b1c4940443985ac7c30ac2afc73d9440323f78e1))
- add disableFrame method ([#39](https://github.com/dequelabs/axe-core-npm/issues/39)) ([2825bb6](https://github.com/dequelabs/axe-core-npm/commit/2825bb681c3179cd02c63a14362583e2b08cde00))
- setup automated releases ([#17](https://github.com/dequelabs/axe-core-npm/issues/17)) ([ad14584](https://github.com/dequelabs/axe-core-npm/commit/ad14584879dc700bcd562736e74c14ec58ee6d87))

### BREAKING CHANGES

- **webdriverjs:** use `new AxeBuilder()`, not `AxeBuilder()`
- **webdriverjs:** you must handle errors
