# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.4.2](https://github.com/dequelabs/axe-core-npm/compare/v4.1.1...v4.4.2) (2022-03-11)


### Bug Fixes

* **cli,reporter-earl,react:** use correct version of axe-core ([#378](https://github.com/dequelabs/axe-core-npm/issues/378)) ([0c7d050](https://github.com/dequelabs/axe-core-npm/commit/0c7d0506b7d397df3c96414fc37a408e90fe9a9c))
* **cli:** add `endTimer()` for page load timer ([#236](https://github.com/dequelabs/axe-core-npm/issues/236)) ([e0a19a3](https://github.com/dequelabs/axe-core-npm/commit/e0a19a3bad9b9965df9b98f391efb3403ab737ae))
* **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))
* **cli:** find axe-core when installed globally ([#232](https://github.com/dequelabs/axe-core-npm/issues/232)) ([75c273d](https://github.com/dequelabs/axe-core-npm/commit/75c273d6b8b4dcec1f953605a5bf4c9b818436cb))
* **cli:** pass chromedriver-path arg to webdriver ([#416](https://github.com/dequelabs/axe-core-npm/issues/416)) ([14e5125](https://github.com/dequelabs/axe-core-npm/commit/14e512551506a333b0249049c3c08c605b2026c3))
* **cli:** provide a more robust error message if analysis fails ([#421](https://github.com/dequelabs/axe-core-npm/issues/421)) ([9f1fa5d](https://github.com/dequelabs/axe-core-npm/commit/9f1fa5d8cb7c2c87bd6e92fe7b13b961e3d73f37))
* **cli:** update packages to use `latest` version of ChromeDriver ([#454](https://github.com/dequelabs/axe-core-npm/issues/454)) ([607fa1b](https://github.com/dequelabs/axe-core-npm/commit/607fa1b3f9d7f0d8181a2ef19df03d53e65f7237))
* pass chrome options to `chromeOptions.addArguments()` ([#262](https://github.com/dequelabs/axe-core-npm/issues/262)) ([715f463](https://github.com/dequelabs/axe-core-npm/commit/715f463c1324d11cafec4a357ee55f446584cd1c))
* **playwright:** allow include/exclude chaining when given a string by the user ([#391](https://github.com/dequelabs/axe-core-npm/issues/391)) ([4b8ab26](https://github.com/dequelabs/axe-core-npm/commit/4b8ab26bb72c4707057127384fede096489a8a8f))
* **playwright:** Make package public ([#264](https://github.com/dequelabs/axe-core-npm/issues/264)) ([35074ba](https://github.com/dequelabs/axe-core-npm/commit/35074baaebe68244ab86ece9f1580ad65975d119))
* **playwright:** use axe-core source without require.resolve() ([#473](https://github.com/dequelabs/axe-core-npm/issues/473)) ([62d9240](https://github.com/dequelabs/axe-core-npm/commit/62d9240acc19d3a68a28174e89e9fae7b775a3f3))
* **react:**  fallback on _reactInternals ([#455](https://github.com/dequelabs/axe-core-npm/issues/455)) ([13f9fd0](https://github.com/dequelabs/axe-core-npm/commit/13f9fd07c24304f0f3dde74d7d41bc8222929c13))
* selenium-webdriverjs peer dependency to allow newer versions ([#258](https://github.com/dequelabs/axe-core-npm/issues/258)) ([2dc2788](https://github.com/dequelabs/axe-core-npm/commit/2dc27883aa4aa40e64766b0bc60191cb1a4f8963))
* **types:** return `this` rather than the class ([#360](https://github.com/dequelabs/axe-core-npm/issues/360)) ([7999891](https://github.com/dequelabs/axe-core-npm/commit/7999891e9cf48a27ee053e702667b55344714896))
* update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
* **webdriverio,webdriverjs:** fix setLegacyMode return type ([#445](https://github.com/dequelabs/axe-core-npm/issues/445)) ([147626a](https://github.com/dequelabs/axe-core-npm/commit/147626a9f6766298a5d0f88a1061895d36a150c7))
* **webdriverio:** include/exclude chaining and iframe selectors ([#409](https://github.com/dequelabs/axe-core-npm/issues/409)) ([ca8aa31](https://github.com/dequelabs/axe-core-npm/commit/ca8aa315251ae206d02843b125ee0e652258d186))
* **webdriverio:** inject axe-core branding into all iframes ([#231](https://github.com/dequelabs/axe-core-npm/issues/231)) ([3f41c27](https://github.com/dequelabs/axe-core-npm/commit/3f41c2709114b894976bcdf03ca2b3d7f824fcae))
* **webdriverio:** Recursively find <frame> ([#238](https://github.com/dequelabs/axe-core-npm/issues/238)) ([7e6a80d](https://github.com/dequelabs/axe-core-npm/commit/7e6a80d856118cceae598de5f91592d6e6c4dc39))
* **webdriverio:** support wdio using puppeteer without esm ([#447](https://github.com/dequelabs/axe-core-npm/issues/447)) ([95dda29](https://github.com/dequelabs/axe-core-npm/commit/95dda2948e18035eaac4377ab9af6450005d0253))
* **webdriverio:** use `executeAsync()` vs `execute()` ([#346](https://github.com/dequelabs/axe-core-npm/issues/346)) ([0e4aa3a](https://github.com/dequelabs/axe-core-npm/commit/0e4aa3ab6f26a48b70cabb7a5bd476e62658c951))
* **webdriverJS:** include/exclude chaining and iframe selectors ([#404](https://github.com/dequelabs/axe-core-npm/issues/404)) ([c7c50fb](https://github.com/dequelabs/axe-core-npm/commit/c7c50fbe6ba91c51c3693ac1220fbd6470532a88))
* **webdriverjs:** prevent selnium undefined -> null transformation ([#402](https://github.com/dequelabs/axe-core-npm/issues/402)) ([5095f43](https://github.com/dequelabs/axe-core-npm/commit/5095f43d371a3ad5c8b5a6b3f94e0ad686e85d7b))
* **webdriverjs:** prevent selnium undefined -> null transformation ([#402](https://github.com/dequelabs/axe-core-npm/issues/402)) ([be3912d](https://github.com/dequelabs/axe-core-npm/commit/be3912d47f6a9d5507aec6af2a01484de554daec))
* **webdriverjs:** Recursively find <frame> ([#209](https://github.com/dequelabs/axe-core-npm/issues/209)) ([0d20e1f](https://github.com/dequelabs/axe-core-npm/commit/0d20e1f3238ca70ccb528867fb1456487c02d0df))
* **webdriverjs:** Reject with actual `Error`s (not strings) ([#423](https://github.com/dequelabs/axe-core-npm/issues/423)) ([3fdb50a](https://github.com/dequelabs/axe-core-npm/commit/3fdb50ad7b9106fa288d7c2b3092ec31de5d984b)), closes [#422](https://github.com/dequelabs/axe-core-npm/issues/422) [#421](https://github.com/dequelabs/axe-core-npm/issues/421) [#387](https://github.com/dequelabs/axe-core-npm/issues/387) [#308](https://github.com/dequelabs/axe-core-npm/issues/308) [#207](https://github.com/dequelabs/axe-core-npm/issues/207)
* **webdriverjs:** resolve promise ([#347](https://github.com/dequelabs/axe-core-npm/issues/347)) ([d1548a5](https://github.com/dequelabs/axe-core-npm/commit/d1548a5ad8c31262a655b7ba1e4fe5b7da888417))


### Features

* Add .setLegacyMode ([#356](https://github.com/dequelabs/axe-core-npm/issues/356)) ([f9d021b](https://github.com/dequelabs/axe-core-npm/commit/f9d021b49487e2a0f804f61e9b6e09a26b69a6e4))
* **playwright:** add playwright integration ([#245](https://github.com/dequelabs/axe-core-npm/issues/245)) ([fec4ada](https://github.com/dequelabs/axe-core-npm/commit/fec4adae9bb9d7971c7d63d6c9f9839b4bd535d8))
* **playwright:** allow `AxeBuilder` to use different version of axe-core ([#335](https://github.com/dequelabs/axe-core-npm/issues/335)) ([f803c98](https://github.com/dequelabs/axe-core-npm/commit/f803c98dc9110d6abe34e7746a076e12f3b6fe45))
* **playwright:** Upgrade to axe-core@4.3.2 ([#334](https://github.com/dequelabs/axe-core-npm/issues/334)) ([b94c75a](https://github.com/dequelabs/axe-core-npm/commit/b94c75a45ae049b1bb5acb6a7e1dc4c094753e05))
* **puppeteer:** Deprecate Frame constructors & Puppeteer < 3.0.3 ([#339](https://github.com/dequelabs/axe-core-npm/issues/339)) ([1ea3047](https://github.com/dequelabs/axe-core-npm/commit/1ea3047a2953c76aedf7fd94923a88631c77a32f))
* **puppeteer:** support puppeteer v9 ([#242](https://github.com/dequelabs/axe-core-npm/issues/242)) ([753a919](https://github.com/dequelabs/axe-core-npm/commit/753a91957c5008908e8b09421e01687bdb445967))
* **puppeteer:** Upgrade to axe-core 4.3 ([#327](https://github.com/dequelabs/axe-core-npm/issues/327)) ([3c9aff1](https://github.com/dequelabs/axe-core-npm/commit/3c9aff1c64f22b17771aa6dd04ed5922f203c094))
* **react:** Add configuration option to optional disable cache (deduplication) ([#309](https://github.com/dequelabs/axe-core-npm/issues/309)) ([435811c](https://github.com/dequelabs/axe-core-npm/commit/435811cb3957cf84b1c1701f6de5c4eb740c8301))
* **react:** Add support for custom logger ([#181](https://github.com/dequelabs/axe-core-npm/issues/181)) ([1f97433](https://github.com/dequelabs/axe-core-npm/commit/1f974338280460715e7b92d58279c3f18fa563f8))
* update `axe-core@4.2.2` ([#263](https://github.com/dequelabs/axe-core-npm/issues/263)) ([8c609e1](https://github.com/dequelabs/axe-core-npm/commit/8c609e1e3580a63f8697ca94e146b0e2ed28e579))
* update axe-core to 4.2.0 ([#240](https://github.com/dequelabs/axe-core-npm/issues/240)) ([4e8f7fe](https://github.com/dequelabs/axe-core-npm/commit/4e8f7fee9db09fb56f91ea34f9984be66a29033e))
* update to use `axe-core@4.2.3` ([#280](https://github.com/dequelabs/axe-core-npm/issues/280)) ([8aebba5](https://github.com/dequelabs/axe-core-npm/commit/8aebba5c6069ca047f649446e072259c069c9a22))
* upgrade axe-core to 4.4.1 ([#441](https://github.com/dequelabs/axe-core-npm/issues/441)) ([765c81a](https://github.com/dequelabs/axe-core-npm/commit/765c81a2ae63e8c72ec086b86174a5c5f343ea9b))
* **wdio:** Upgrade to support, and use types of v7 ([#364](https://github.com/dequelabs/axe-core-npm/issues/364)) ([734e7bd](https://github.com/dequelabs/axe-core-npm/commit/734e7bd73e48902be0af26adc5a09f079190ce7f))
* **webdriverio:** allow `AxeBuilder` to use different version of axe-core ([#333](https://github.com/dequelabs/axe-core-npm/issues/333)) ([25a8c1b](https://github.com/dequelabs/axe-core-npm/commit/25a8c1bae945b24661ac456d917ad76d22789e82))
* **webdriverio:** Upgrade to axe-core@4.3.3 ([#331](https://github.com/dequelabs/axe-core-npm/issues/331)) ([2135347](https://github.com/dequelabs/axe-core-npm/commit/21353478bb4fb75688ffcfcd3a8a0e7198a8f0d3))
* **webdriverjs:** upgrade to axe-core 4.3 ([#312](https://github.com/dequelabs/axe-core-npm/issues/312)) ([b416e74](https://github.com/dequelabs/axe-core-npm/commit/b416e74fb56526021b010996c0e1382269627efa))





## [4.4.1](https://github.com/dequelabs/axe-core-npm/compare/v4.1.1...v4.4.1) (2022-02-15)


### Bug Fixes

* **cli,reporter-earl,react:** use correct version of axe-core ([#378](https://github.com/dequelabs/axe-core-npm/issues/378)) ([0c7d050](https://github.com/dequelabs/axe-core-npm/commit/0c7d0506b7d397df3c96414fc37a408e90fe9a9c))
* **cli:** add `endTimer()` for page load timer ([#236](https://github.com/dequelabs/axe-core-npm/issues/236)) ([e0a19a3](https://github.com/dequelabs/axe-core-npm/commit/e0a19a3bad9b9965df9b98f391efb3403ab737ae))
* **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))
* **cli:** find axe-core when installed globally ([#232](https://github.com/dequelabs/axe-core-npm/issues/232)) ([75c273d](https://github.com/dequelabs/axe-core-npm/commit/75c273d6b8b4dcec1f953605a5bf4c9b818436cb))
* **cli:** pass chromedriver-path arg to webdriver ([#416](https://github.com/dequelabs/axe-core-npm/issues/416)) ([14e5125](https://github.com/dequelabs/axe-core-npm/commit/14e512551506a333b0249049c3c08c605b2026c3))
* **cli:** provide a more robust error message if analysis fails ([#421](https://github.com/dequelabs/axe-core-npm/issues/421)) ([9f1fa5d](https://github.com/dequelabs/axe-core-npm/commit/9f1fa5d8cb7c2c87bd6e92fe7b13b961e3d73f37))
* **cli:** update packages to use `latest` version of ChromeDriver ([#454](https://github.com/dequelabs/axe-core-npm/issues/454)) ([607fa1b](https://github.com/dequelabs/axe-core-npm/commit/607fa1b3f9d7f0d8181a2ef19df03d53e65f7237))
* pass chrome options to `chromeOptions.addArguments()` ([#262](https://github.com/dequelabs/axe-core-npm/issues/262)) ([715f463](https://github.com/dequelabs/axe-core-npm/commit/715f463c1324d11cafec4a357ee55f446584cd1c))
* **playwright:** allow include/exclude chaining when given a string by the user ([#391](https://github.com/dequelabs/axe-core-npm/issues/391)) ([4b8ab26](https://github.com/dequelabs/axe-core-npm/commit/4b8ab26bb72c4707057127384fede096489a8a8f))
* **playwright:** Make package public ([#264](https://github.com/dequelabs/axe-core-npm/issues/264)) ([35074ba](https://github.com/dequelabs/axe-core-npm/commit/35074baaebe68244ab86ece9f1580ad65975d119))
* **react:**  fallback on _reactInternals ([#455](https://github.com/dequelabs/axe-core-npm/issues/455)) ([13f9fd0](https://github.com/dequelabs/axe-core-npm/commit/13f9fd07c24304f0f3dde74d7d41bc8222929c13))
* selenium-webdriverjs peer dependency to allow newer versions ([#258](https://github.com/dequelabs/axe-core-npm/issues/258)) ([2dc2788](https://github.com/dequelabs/axe-core-npm/commit/2dc27883aa4aa40e64766b0bc60191cb1a4f8963))
* **types:** return `this` rather than the class ([#360](https://github.com/dequelabs/axe-core-npm/issues/360)) ([7999891](https://github.com/dequelabs/axe-core-npm/commit/7999891e9cf48a27ee053e702667b55344714896))
* update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
* **webdriverio,webdriverjs:** fix setLegacyMode return type ([#445](https://github.com/dequelabs/axe-core-npm/issues/445)) ([147626a](https://github.com/dequelabs/axe-core-npm/commit/147626a9f6766298a5d0f88a1061895d36a150c7))
* **webdriverio:** include/exclude chaining and iframe selectors ([#409](https://github.com/dequelabs/axe-core-npm/issues/409)) ([ca8aa31](https://github.com/dequelabs/axe-core-npm/commit/ca8aa315251ae206d02843b125ee0e652258d186))
* **webdriverio:** inject axe-core branding into all iframes ([#231](https://github.com/dequelabs/axe-core-npm/issues/231)) ([3f41c27](https://github.com/dequelabs/axe-core-npm/commit/3f41c2709114b894976bcdf03ca2b3d7f824fcae))
* **webdriverio:** Recursively find <frame> ([#238](https://github.com/dequelabs/axe-core-npm/issues/238)) ([7e6a80d](https://github.com/dequelabs/axe-core-npm/commit/7e6a80d856118cceae598de5f91592d6e6c4dc39))
* **webdriverio:** support wdio using puppeteer without esm ([#447](https://github.com/dequelabs/axe-core-npm/issues/447)) ([95dda29](https://github.com/dequelabs/axe-core-npm/commit/95dda2948e18035eaac4377ab9af6450005d0253))
* **webdriverio:** use `executeAsync()` vs `execute()` ([#346](https://github.com/dequelabs/axe-core-npm/issues/346)) ([0e4aa3a](https://github.com/dequelabs/axe-core-npm/commit/0e4aa3ab6f26a48b70cabb7a5bd476e62658c951))
* **webdriverJS:** include/exclude chaining and iframe selectors ([#404](https://github.com/dequelabs/axe-core-npm/issues/404)) ([c7c50fb](https://github.com/dequelabs/axe-core-npm/commit/c7c50fbe6ba91c51c3693ac1220fbd6470532a88))
* **webdriverjs:** prevent selnium undefined -> null transformation ([#402](https://github.com/dequelabs/axe-core-npm/issues/402)) ([5095f43](https://github.com/dequelabs/axe-core-npm/commit/5095f43d371a3ad5c8b5a6b3f94e0ad686e85d7b))
* **webdriverjs:** prevent selnium undefined -> null transformation ([#402](https://github.com/dequelabs/axe-core-npm/issues/402)) ([be3912d](https://github.com/dequelabs/axe-core-npm/commit/be3912d47f6a9d5507aec6af2a01484de554daec))
* **webdriverjs:** Recursively find <frame> ([#209](https://github.com/dequelabs/axe-core-npm/issues/209)) ([0d20e1f](https://github.com/dequelabs/axe-core-npm/commit/0d20e1f3238ca70ccb528867fb1456487c02d0df))
* **webdriverjs:** Reject with actual `Error`s (not strings) ([#423](https://github.com/dequelabs/axe-core-npm/issues/423)) ([3fdb50a](https://github.com/dequelabs/axe-core-npm/commit/3fdb50ad7b9106fa288d7c2b3092ec31de5d984b)), closes [#422](https://github.com/dequelabs/axe-core-npm/issues/422) [#421](https://github.com/dequelabs/axe-core-npm/issues/421) [#387](https://github.com/dequelabs/axe-core-npm/issues/387) [#308](https://github.com/dequelabs/axe-core-npm/issues/308) [#207](https://github.com/dequelabs/axe-core-npm/issues/207)
* **webdriverjs:** resolve promise ([#347](https://github.com/dequelabs/axe-core-npm/issues/347)) ([d1548a5](https://github.com/dequelabs/axe-core-npm/commit/d1548a5ad8c31262a655b7ba1e4fe5b7da888417))


### Features

* Add .setLegacyMode ([#356](https://github.com/dequelabs/axe-core-npm/issues/356)) ([f9d021b](https://github.com/dequelabs/axe-core-npm/commit/f9d021b49487e2a0f804f61e9b6e09a26b69a6e4))
* **playwright:** add playwright integration ([#245](https://github.com/dequelabs/axe-core-npm/issues/245)) ([fec4ada](https://github.com/dequelabs/axe-core-npm/commit/fec4adae9bb9d7971c7d63d6c9f9839b4bd535d8))
* **playwright:** allow `AxeBuilder` to use different version of axe-core ([#335](https://github.com/dequelabs/axe-core-npm/issues/335)) ([f803c98](https://github.com/dequelabs/axe-core-npm/commit/f803c98dc9110d6abe34e7746a076e12f3b6fe45))
* **playwright:** Upgrade to axe-core@4.3.2 ([#334](https://github.com/dequelabs/axe-core-npm/issues/334)) ([b94c75a](https://github.com/dequelabs/axe-core-npm/commit/b94c75a45ae049b1bb5acb6a7e1dc4c094753e05))
* **puppeteer:** Deprecate Frame constructors & Puppeteer < 3.0.3 ([#339](https://github.com/dequelabs/axe-core-npm/issues/339)) ([1ea3047](https://github.com/dequelabs/axe-core-npm/commit/1ea3047a2953c76aedf7fd94923a88631c77a32f))
* **puppeteer:** support puppeteer v9 ([#242](https://github.com/dequelabs/axe-core-npm/issues/242)) ([753a919](https://github.com/dequelabs/axe-core-npm/commit/753a91957c5008908e8b09421e01687bdb445967))
* **puppeteer:** Upgrade to axe-core 4.3 ([#327](https://github.com/dequelabs/axe-core-npm/issues/327)) ([3c9aff1](https://github.com/dequelabs/axe-core-npm/commit/3c9aff1c64f22b17771aa6dd04ed5922f203c094))
* **react:** Add configuration option to optional disable cache (deduplication) ([#309](https://github.com/dequelabs/axe-core-npm/issues/309)) ([435811c](https://github.com/dequelabs/axe-core-npm/commit/435811cb3957cf84b1c1701f6de5c4eb740c8301))
* **react:** Add support for custom logger ([#181](https://github.com/dequelabs/axe-core-npm/issues/181)) ([1f97433](https://github.com/dequelabs/axe-core-npm/commit/1f974338280460715e7b92d58279c3f18fa563f8))
* update `axe-core@4.2.2` ([#263](https://github.com/dequelabs/axe-core-npm/issues/263)) ([8c609e1](https://github.com/dequelabs/axe-core-npm/commit/8c609e1e3580a63f8697ca94e146b0e2ed28e579))
* update axe-core to 4.2.0 ([#240](https://github.com/dequelabs/axe-core-npm/issues/240)) ([4e8f7fe](https://github.com/dequelabs/axe-core-npm/commit/4e8f7fee9db09fb56f91ea34f9984be66a29033e))
* update to use `axe-core@4.2.3` ([#280](https://github.com/dequelabs/axe-core-npm/issues/280)) ([8aebba5](https://github.com/dequelabs/axe-core-npm/commit/8aebba5c6069ca047f649446e072259c069c9a22))
* upgrade axe-core to 4.4.1 ([#441](https://github.com/dequelabs/axe-core-npm/issues/441)) ([765c81a](https://github.com/dequelabs/axe-core-npm/commit/765c81a2ae63e8c72ec086b86174a5c5f343ea9b))
* **wdio:** Upgrade to support, and use types of v7 ([#364](https://github.com/dequelabs/axe-core-npm/issues/364)) ([734e7bd](https://github.com/dequelabs/axe-core-npm/commit/734e7bd73e48902be0af26adc5a09f079190ce7f))
* **webdriverio:** allow `AxeBuilder` to use different version of axe-core ([#333](https://github.com/dequelabs/axe-core-npm/issues/333)) ([25a8c1b](https://github.com/dequelabs/axe-core-npm/commit/25a8c1bae945b24661ac456d917ad76d22789e82))
* **webdriverio:** Upgrade to axe-core@4.3.3 ([#331](https://github.com/dequelabs/axe-core-npm/issues/331)) ([2135347](https://github.com/dequelabs/axe-core-npm/commit/21353478bb4fb75688ffcfcd3a8a0e7198a8f0d3))
* **webdriverjs:** upgrade to axe-core 4.3 ([#312](https://github.com/dequelabs/axe-core-npm/issues/312)) ([b416e74](https://github.com/dequelabs/axe-core-npm/commit/b416e74fb56526021b010996c0e1382269627efa))





# [4.4.0](https://github.com/dequelabs/axe-core-npm/compare/v4.1.1...v4.4.0) (2022-02-10)


### Bug Fixes

* **cli,reporter-earl,react:** use correct version of axe-core ([#378](https://github.com/dequelabs/axe-core-npm/issues/378)) ([0c7d050](https://github.com/dequelabs/axe-core-npm/commit/0c7d0506b7d397df3c96414fc37a408e90fe9a9c))
* **cli:** add `endTimer()` for page load timer ([#236](https://github.com/dequelabs/axe-core-npm/issues/236)) ([e0a19a3](https://github.com/dequelabs/axe-core-npm/commit/e0a19a3bad9b9965df9b98f391efb3403ab737ae))
* **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))
* **cli:** find axe-core when installed globally ([#232](https://github.com/dequelabs/axe-core-npm/issues/232)) ([75c273d](https://github.com/dequelabs/axe-core-npm/commit/75c273d6b8b4dcec1f953605a5bf4c9b818436cb))
* **cli:** pass chromedriver-path arg to webdriver ([#416](https://github.com/dequelabs/axe-core-npm/issues/416)) ([14e5125](https://github.com/dequelabs/axe-core-npm/commit/14e512551506a333b0249049c3c08c605b2026c3))
* **cli:** provide a more robust error message if analysis fails ([#421](https://github.com/dequelabs/axe-core-npm/issues/421)) ([9f1fa5d](https://github.com/dequelabs/axe-core-npm/commit/9f1fa5d8cb7c2c87bd6e92fe7b13b961e3d73f37))
* pass chrome options to `chromeOptions.addArguments()` ([#262](https://github.com/dequelabs/axe-core-npm/issues/262)) ([715f463](https://github.com/dequelabs/axe-core-npm/commit/715f463c1324d11cafec4a357ee55f446584cd1c))
* **playwright:** allow include/exclude chaining when given a string by the user ([#391](https://github.com/dequelabs/axe-core-npm/issues/391)) ([4b8ab26](https://github.com/dequelabs/axe-core-npm/commit/4b8ab26bb72c4707057127384fede096489a8a8f))
* **playwright:** Make package public ([#264](https://github.com/dequelabs/axe-core-npm/issues/264)) ([35074ba](https://github.com/dequelabs/axe-core-npm/commit/35074baaebe68244ab86ece9f1580ad65975d119))
* selenium-webdriverjs peer dependency to allow newer versions ([#258](https://github.com/dequelabs/axe-core-npm/issues/258)) ([2dc2788](https://github.com/dequelabs/axe-core-npm/commit/2dc27883aa4aa40e64766b0bc60191cb1a4f8963))
* **types:** return `this` rather than the class ([#360](https://github.com/dequelabs/axe-core-npm/issues/360)) ([7999891](https://github.com/dequelabs/axe-core-npm/commit/7999891e9cf48a27ee053e702667b55344714896))
* update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
* **webdriverio,webdriverjs:** fix setLegacyMode return type ([#445](https://github.com/dequelabs/axe-core-npm/issues/445)) ([147626a](https://github.com/dequelabs/axe-core-npm/commit/147626a9f6766298a5d0f88a1061895d36a150c7))
* **webdriverio:** include/exclude chaining and iframe selectors ([#409](https://github.com/dequelabs/axe-core-npm/issues/409)) ([ca8aa31](https://github.com/dequelabs/axe-core-npm/commit/ca8aa315251ae206d02843b125ee0e652258d186))
* **webdriverio:** inject axe-core branding into all iframes ([#231](https://github.com/dequelabs/axe-core-npm/issues/231)) ([3f41c27](https://github.com/dequelabs/axe-core-npm/commit/3f41c2709114b894976bcdf03ca2b3d7f824fcae))
* **webdriverio:** Recursively find <frame> ([#238](https://github.com/dequelabs/axe-core-npm/issues/238)) ([7e6a80d](https://github.com/dequelabs/axe-core-npm/commit/7e6a80d856118cceae598de5f91592d6e6c4dc39))
* **webdriverio:** support wdio using puppeteer without esm ([#447](https://github.com/dequelabs/axe-core-npm/issues/447)) ([95dda29](https://github.com/dequelabs/axe-core-npm/commit/95dda2948e18035eaac4377ab9af6450005d0253))
* **webdriverio:** use `executeAsync()` vs `execute()` ([#346](https://github.com/dequelabs/axe-core-npm/issues/346)) ([0e4aa3a](https://github.com/dequelabs/axe-core-npm/commit/0e4aa3ab6f26a48b70cabb7a5bd476e62658c951))
* **webdriverJS:** include/exclude chaining and iframe selectors ([#404](https://github.com/dequelabs/axe-core-npm/issues/404)) ([c7c50fb](https://github.com/dequelabs/axe-core-npm/commit/c7c50fbe6ba91c51c3693ac1220fbd6470532a88))
* **webdriverjs:** prevent selnium undefined -> null transformation ([#402](https://github.com/dequelabs/axe-core-npm/issues/402)) ([5095f43](https://github.com/dequelabs/axe-core-npm/commit/5095f43d371a3ad5c8b5a6b3f94e0ad686e85d7b))
* **webdriverjs:** prevent selnium undefined -> null transformation ([#402](https://github.com/dequelabs/axe-core-npm/issues/402)) ([be3912d](https://github.com/dequelabs/axe-core-npm/commit/be3912d47f6a9d5507aec6af2a01484de554daec))
* **webdriverjs:** Recursively find <frame> ([#209](https://github.com/dequelabs/axe-core-npm/issues/209)) ([0d20e1f](https://github.com/dequelabs/axe-core-npm/commit/0d20e1f3238ca70ccb528867fb1456487c02d0df))
* **webdriverjs:** Reject with actual `Error`s (not strings) ([#423](https://github.com/dequelabs/axe-core-npm/issues/423)) ([3fdb50a](https://github.com/dequelabs/axe-core-npm/commit/3fdb50ad7b9106fa288d7c2b3092ec31de5d984b)), closes [#422](https://github.com/dequelabs/axe-core-npm/issues/422) [#421](https://github.com/dequelabs/axe-core-npm/issues/421) [#387](https://github.com/dequelabs/axe-core-npm/issues/387) [#308](https://github.com/dequelabs/axe-core-npm/issues/308) [#207](https://github.com/dequelabs/axe-core-npm/issues/207)
* **webdriverjs:** resolve promise ([#347](https://github.com/dequelabs/axe-core-npm/issues/347)) ([d1548a5](https://github.com/dequelabs/axe-core-npm/commit/d1548a5ad8c31262a655b7ba1e4fe5b7da888417))


### Features

* Add .setLegacyMode ([#356](https://github.com/dequelabs/axe-core-npm/issues/356)) ([f9d021b](https://github.com/dequelabs/axe-core-npm/commit/f9d021b49487e2a0f804f61e9b6e09a26b69a6e4))
* **playwright:** add playwright integration ([#245](https://github.com/dequelabs/axe-core-npm/issues/245)) ([fec4ada](https://github.com/dequelabs/axe-core-npm/commit/fec4adae9bb9d7971c7d63d6c9f9839b4bd535d8))
* **playwright:** allow `AxeBuilder` to use different version of axe-core ([#335](https://github.com/dequelabs/axe-core-npm/issues/335)) ([f803c98](https://github.com/dequelabs/axe-core-npm/commit/f803c98dc9110d6abe34e7746a076e12f3b6fe45))
* **playwright:** Upgrade to axe-core@4.3.2 ([#334](https://github.com/dequelabs/axe-core-npm/issues/334)) ([b94c75a](https://github.com/dequelabs/axe-core-npm/commit/b94c75a45ae049b1bb5acb6a7e1dc4c094753e05))
* **puppeteer:** Deprecate Frame constructors & Puppeteer < 3.0.3 ([#339](https://github.com/dequelabs/axe-core-npm/issues/339)) ([1ea3047](https://github.com/dequelabs/axe-core-npm/commit/1ea3047a2953c76aedf7fd94923a88631c77a32f))
* **puppeteer:** support puppeteer v9 ([#242](https://github.com/dequelabs/axe-core-npm/issues/242)) ([753a919](https://github.com/dequelabs/axe-core-npm/commit/753a91957c5008908e8b09421e01687bdb445967))
* **puppeteer:** Upgrade to axe-core 4.3 ([#327](https://github.com/dequelabs/axe-core-npm/issues/327)) ([3c9aff1](https://github.com/dequelabs/axe-core-npm/commit/3c9aff1c64f22b17771aa6dd04ed5922f203c094))
* **react:** Add configuration option to optional disable cache (deduplication) ([#309](https://github.com/dequelabs/axe-core-npm/issues/309)) ([435811c](https://github.com/dequelabs/axe-core-npm/commit/435811cb3957cf84b1c1701f6de5c4eb740c8301))
* **react:** Add support for custom logger ([#181](https://github.com/dequelabs/axe-core-npm/issues/181)) ([1f97433](https://github.com/dequelabs/axe-core-npm/commit/1f974338280460715e7b92d58279c3f18fa563f8))
* update `axe-core@4.2.2` ([#263](https://github.com/dequelabs/axe-core-npm/issues/263)) ([8c609e1](https://github.com/dequelabs/axe-core-npm/commit/8c609e1e3580a63f8697ca94e146b0e2ed28e579))
* update axe-core to 4.2.0 ([#240](https://github.com/dequelabs/axe-core-npm/issues/240)) ([4e8f7fe](https://github.com/dequelabs/axe-core-npm/commit/4e8f7fee9db09fb56f91ea34f9984be66a29033e))
* update to use `axe-core@4.2.3` ([#280](https://github.com/dequelabs/axe-core-npm/issues/280)) ([8aebba5](https://github.com/dequelabs/axe-core-npm/commit/8aebba5c6069ca047f649446e072259c069c9a22))
* upgrade axe-core to 4.4.1 ([#441](https://github.com/dequelabs/axe-core-npm/issues/441)) ([765c81a](https://github.com/dequelabs/axe-core-npm/commit/765c81a2ae63e8c72ec086b86174a5c5f343ea9b))
* **wdio:** Upgrade to support, and use types of v7 ([#364](https://github.com/dequelabs/axe-core-npm/issues/364)) ([734e7bd](https://github.com/dequelabs/axe-core-npm/commit/734e7bd73e48902be0af26adc5a09f079190ce7f))
* **webdriverio:** allow `AxeBuilder` to use different version of axe-core ([#333](https://github.com/dequelabs/axe-core-npm/issues/333)) ([25a8c1b](https://github.com/dequelabs/axe-core-npm/commit/25a8c1bae945b24661ac456d917ad76d22789e82))
* **webdriverio:** Upgrade to axe-core@4.3.3 ([#331](https://github.com/dequelabs/axe-core-npm/issues/331)) ([2135347](https://github.com/dequelabs/axe-core-npm/commit/21353478bb4fb75688ffcfcd3a8a0e7198a8f0d3))
* **webdriverjs:** upgrade to axe-core 4.3 ([#312](https://github.com/dequelabs/axe-core-npm/issues/312)) ([b416e74](https://github.com/dequelabs/axe-core-npm/commit/b416e74fb56526021b010996c0e1382269627efa))





## [4.3.1](https://github.com/dequelabs/axe-core-npm/compare/v4.3.0...v4.3.1) (2021-09-20)

### Bug Fixes

- **cli,reporter-earl,react:** use correct version of axe-core ([#378](https://github.com/dequelabs/axe-core-npm/issues/378)) ([0c7d050](https://github.com/dequelabs/axe-core-npm/commit/0c7d0506b7d397df3c96414fc37a408e90fe9a9c))

# [4.3.0](https://github.com/dequelabs/axe-core-npm/compare/v4.2.0...v4.3.0) (2021-09-20)

### Bug Fixes

- **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))
- **playwright:** Make package public ([#264](https://github.com/dequelabs/axe-core-npm/issues/264)) ([35074ba](https://github.com/dequelabs/axe-core-npm/commit/35074baaebe68244ab86ece9f1580ad65975d119))
- **types:** return `this` rather than the class ([#360](https://github.com/dequelabs/axe-core-npm/issues/360)) ([7999891](https://github.com/dequelabs/axe-core-npm/commit/7999891e9cf48a27ee053e702667b55344714896))
- **webdriverio:** use `executeAsync()` vs `execute()` ([#346](https://github.com/dequelabs/axe-core-npm/issues/346)) ([0e4aa3a](https://github.com/dequelabs/axe-core-npm/commit/0e4aa3ab6f26a48b70cabb7a5bd476e62658c951))
- **webdriverjs:** resolve promise ([#347](https://github.com/dequelabs/axe-core-npm/issues/347)) ([d1548a5](https://github.com/dequelabs/axe-core-npm/commit/d1548a5ad8c31262a655b7ba1e4fe5b7da888417))
- pass chrome options to `chromeOptions.addArguments()` ([#262](https://github.com/dequelabs/axe-core-npm/issues/262)) ([715f463](https://github.com/dequelabs/axe-core-npm/commit/715f463c1324d11cafec4a357ee55f446584cd1c))
- selenium-webdriverjs peer dependency to allow newer versions ([#258](https://github.com/dequelabs/axe-core-npm/issues/258)) ([2dc2788](https://github.com/dequelabs/axe-core-npm/commit/2dc27883aa4aa40e64766b0bc60191cb1a4f8963))
- update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))

### Features

- **wdio:** Upgrade to support, and use types of v7 ([#364](https://github.com/dequelabs/axe-core-npm/issues/364)) ([734e7bd](https://github.com/dequelabs/axe-core-npm/commit/734e7bd73e48902be0af26adc5a09f079190ce7f))
- Add .setLegacyMode ([#356](https://github.com/dequelabs/axe-core-npm/issues/356)) ([f9d021b](https://github.com/dequelabs/axe-core-npm/commit/f9d021b49487e2a0f804f61e9b6e09a26b69a6e4))
- **playwright:** add playwright integration ([#245](https://github.com/dequelabs/axe-core-npm/issues/245)) ([fec4ada](https://github.com/dequelabs/axe-core-npm/commit/fec4adae9bb9d7971c7d63d6c9f9839b4bd535d8))
- **playwright:** allow `AxeBuilder` to use different version of axe-core ([#335](https://github.com/dequelabs/axe-core-npm/issues/335)) ([f803c98](https://github.com/dequelabs/axe-core-npm/commit/f803c98dc9110d6abe34e7746a076e12f3b6fe45))
- **playwright:** Upgrade to axe-core@4.3.2 ([#334](https://github.com/dequelabs/axe-core-npm/issues/334)) ([b94c75a](https://github.com/dequelabs/axe-core-npm/commit/b94c75a45ae049b1bb5acb6a7e1dc4c094753e05))
- **puppeteer:** Deprecate Frame constructors & Puppeteer < 3.0.3 ([#339](https://github.com/dequelabs/axe-core-npm/issues/339)) ([1ea3047](https://github.com/dequelabs/axe-core-npm/commit/1ea3047a2953c76aedf7fd94923a88631c77a32f))
- **puppeteer:** Upgrade to axe-core 4.3 ([#327](https://github.com/dequelabs/axe-core-npm/issues/327)) ([3c9aff1](https://github.com/dequelabs/axe-core-npm/commit/3c9aff1c64f22b17771aa6dd04ed5922f203c094))
- **react:** Add configuration option to optional disable cache (deduplication) ([#309](https://github.com/dequelabs/axe-core-npm/issues/309)) ([435811c](https://github.com/dequelabs/axe-core-npm/commit/435811cb3957cf84b1c1701f6de5c4eb740c8301))
- **react:** Add support for custom logger ([#181](https://github.com/dequelabs/axe-core-npm/issues/181)) ([1f97433](https://github.com/dequelabs/axe-core-npm/commit/1f974338280460715e7b92d58279c3f18fa563f8))
- **webdriverio:** allow `AxeBuilder` to use different version of axe-core ([#333](https://github.com/dequelabs/axe-core-npm/issues/333)) ([25a8c1b](https://github.com/dequelabs/axe-core-npm/commit/25a8c1bae945b24661ac456d917ad76d22789e82))
- **webdriverio:** Upgrade to axe-core@4.3.3 ([#331](https://github.com/dequelabs/axe-core-npm/issues/331)) ([2135347](https://github.com/dequelabs/axe-core-npm/commit/21353478bb4fb75688ffcfcd3a8a0e7198a8f0d3))
- **webdriverjs:** upgrade to axe-core 4.3 ([#312](https://github.com/dequelabs/axe-core-npm/issues/312)) ([b416e74](https://github.com/dequelabs/axe-core-npm/commit/b416e74fb56526021b010996c0e1382269627efa))
- update `axe-core@4.2.2` ([#263](https://github.com/dequelabs/axe-core-npm/issues/263)) ([8c609e1](https://github.com/dequelabs/axe-core-npm/commit/8c609e1e3580a63f8697ca94e146b0e2ed28e579))
- update to use `axe-core@4.2.3` ([#280](https://github.com/dequelabs/axe-core-npm/issues/280)) ([8aebba5](https://github.com/dequelabs/axe-core-npm/commit/8aebba5c6069ca047f649446e072259c069c9a22))

## [4.2.2](https://github.com/dequelabs/axe-core-npm/compare/v4.2.0...v4.2.2) (2021-06-23)

### Bug Fixes

- **playwright:** Make package public ([#264](https://github.com/dequelabs/axe-core-npm/issues/264)) ([35074ba](https://github.com/dequelabs/axe-core-npm/commit/35074baaebe68244ab86ece9f1580ad65975d119))
- pass chrome options to `chromeOptions.addArguments()` ([#262](https://github.com/dequelabs/axe-core-npm/issues/262)) ([715f463](https://github.com/dequelabs/axe-core-npm/commit/715f463c1324d11cafec4a357ee55f446584cd1c))
- selenium-webdriverjs peer dependency to allow newer versions ([#258](https://github.com/dequelabs/axe-core-npm/issues/258)) ([2dc2788](https://github.com/dequelabs/axe-core-npm/commit/2dc27883aa4aa40e64766b0bc60191cb1a4f8963))
- update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
- **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))

### Features

- update to use `axe-core@4.2.3` ([#280](https://github.com/dequelabs/axe-core-npm/issues/280)) ([8aebba5](https://github.com/dequelabs/axe-core-npm/commit/8aebba5c6069ca047f649446e072259c069c9a22))
- **react:** Add support for custom logger ([#181](https://github.com/dequelabs/axe-core-npm/issues/181)) ([1f97433](https://github.com/dequelabs/axe-core-npm/commit/1f974338280460715e7b92d58279c3f18fa563f8))
- update `axe-core@4.2.2` ([#263](https://github.com/dequelabs/axe-core-npm/issues/263)) ([8c609e1](https://github.com/dequelabs/axe-core-npm/commit/8c609e1e3580a63f8697ca94e146b0e2ed28e579))
- **playwright:** add playwright integration ([#245](https://github.com/dequelabs/axe-core-npm/issues/245)) ([fec4ada](https://github.com/dequelabs/axe-core-npm/commit/fec4adae9bb9d7971c7d63d6c9f9839b4bd535d8))

## [4.2.1](https://github.com/dequelabs/axe-core-npm/compare/v4.2.0...v4.2.1) (2021-05-19)

### Bug Fixes

- update axe-core to 4.2.1 ([#254](https://github.com/dequelabs/axe-core-npm/issues/254)) ([9d90185](https://github.com/dequelabs/axe-core-npm/commit/9d9018525a4d799f6d763d0329f05ccbfd20dbe4))
- **cli:** add timeout waiting for page to be ready ([#250](https://github.com/dequelabs/axe-core-npm/issues/250)) ([cbb795f](https://github.com/dequelabs/axe-core-npm/commit/cbb795f1a92c419794a5f1f9645e28493d7c9bdb))

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
