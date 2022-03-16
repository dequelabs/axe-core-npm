# @axe-core/reporter-earl

This project is a reporter for [axe-core](https://github.com/dequelabs/axe-core). When used as part of an axe-core run, it will produce results using the [Evaluation And Reporting Language (EARL) 1.0](https://www.w3.org/TR/EARL10-Schema/). The reporter uses [JSON-LD](https://json-ld.org/spec/latest/json-ld/) to serialise the RDF data.

Previous versions of this program were maintained at [dequelabs/axe-reporter-earl](https://github.com/dequelabs/axe-reporter-earl).

## Installation

To install Axe-reporter-earl, with NPM, run:

```shell
npm install @axe-core/reporter-earl
```

## Usage

The EARL reporter can be passed to axe, either as part of configuration or as part of the run:

CommonJS Require Syntax:

```js
const reporter = require('@axe-core/reporter-earl').default;
// Define the reporter through axe.configure
axe.configure({ reporter });
axe.run().then(earlResults => console.log(earlResults));
```

```js
const reporter = require('@axe-core/reporter-earl').default;
// Use the reporter in a single axe.run call
axe.run({ reporter }).then(earlResults => console.log(earlResults));
```

ES6 Import Syntax:

```js
import reporter from '@axe-core/reporter-earl';
// Define the reporter through axe.configure
axe.configure({ reporter });
axe.run().then(earlResults => console.log(earlResults));
```

```js
import reporter from '@axe-core/reporter-earl';
// Use the reporter in a single axe.run call
axe.run({ reporter }).then(earlResults => console.log(earlResults));
```

## Format

The repoter format should look something like this:

```json
{
  "@context": {
    "@vocab": "http://www.w3.org/ns/earl#",
    "earl": "http://www.w3.org/ns/earl#",
    "WCAG20": "http://www.w3.org/TR/WCAG20/#",
    "WCAG21": "http://www.w3.org/TR/WCAG21/#",
    "auto-wcag": "https://auto-wcag.github.io/auto-wcag/rules/",
    "dct": "http://purl.org/dc/terms#",
    "sch": "https://schema.org/",
    "doap": "http://usefulinc.com/ns/doap#",
    "foaf": "http://xmlns.com/foaf/spec/#",
    "WebPage": "sch:WebPage",
    "url": "dct:source",
    "assertions": {
      "@reverse": "subject"
    },
    "assertedBy": {
      "@type": "@id"
    },
    "outcome": {
      "@type": "@id"
    },
    "mode": {
      "@type": "@id"
    },
    "pointer": {
      "@type": "ptr:CSSSelectorPointer"
    }
  },
  "@type": "WebPage",
  "url": "http://localhost/",
  "assertions": [
    {
      "assertedBy": {
        "@id": "https://github.com/dequelabs/axe-core/releases/tag/3.1.2",
        "@type": ["earl:Assertor", "earl:Software", "doap:Project"],
        "doap:name": "Axe",
        "doap:vendor": {
          "@id": "https://deque.com/",
          "@type": "foaf:Organization",
          "foaf:name": "Deque Systems"
        }
      },
      "test": {
        "@type": "TestCase",
        "@id": "https://dequeuniversity.com/rules/axe/3.1/foo"
      },
      "result": {
        "@type": "TestResult",
        "outcome": "earl:inapplicable"
      },
      "@type": "Assertion",
      "mode": "earl:automatic"
    },
    {
      "assertedBy": {
        "@id": "https://github.com/dequelabs/axe-core/releases/tag/3.1.2",
        "@type": ["earl:Assertor", "earl:Software", "doap:Project"],
        "doap:name": "Axe",
        "doap:vendor": {
          "@id": "https://deque.com/",
          "@type": "foaf:Organization",
          "foaf:name": "Deque Systems"
        }
      },
      "test": {
        "@type": "TestCase",
        "@id": "https://dequeuniversity.com/rules/axe/3.1/bar"
      },
      "result": {
        "@type": "TestResult",
        "info": "Ensures role attribute has an appropriate value for the element",
        "outcome": "earl:undefined",
        "pointer": "#foo"
      },
      "@type": "Assertion",
      "mode": "earl:automatic"
    }
  ]
}
```
