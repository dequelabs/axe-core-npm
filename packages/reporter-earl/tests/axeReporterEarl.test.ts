// jsonld depends on @digitalbazaar/http-client, which depends on the undici HTTP client,
// which depends on TextEncoder ... which however isn't provided by jsdom, see
// https://github.com/jsdom/jsdom/issues/2524.
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

import jsonld from 'jsonld';
import axe from 'axe-core';
import { getDummyData } from './utils';
import axeReporterEarl, { createEarlReport } from '../src/axeReporterEarl';
import context from '../src/context.json';
import { RawResult, EarlType } from '../src/types';
import { describe, beforeEach, test, expect } from '@jest/globals';

describe(`createEarlReport`, () => {
  let dummyData: RawResult[];
  beforeEach(async () => {
    dummyData = await getDummyData();
  });

  test(`returns the @context object`, () => {
    const earlReport = createEarlReport(dummyData);
    expect(earlReport['@context']).toEqual(context);
  });

  test(`returns with "@type": "WebPage"`, async () => {
    const earlReport = createEarlReport(dummyData);
    expect(earlReport['@type']).toEqual(EarlType.WebPage);
  });

  test(`returns with "assertions": Array`, () => {
    const earlReport = createEarlReport(dummyData);
    expect(Array.isArray(earlReport.assertions)).toBe(true);
  });

  test(`returns { url } from window.location.href `, () => {
    const earlReport = createEarlReport(dummyData);
    expect(window.location.href).toBeDefined();
    expect(earlReport['url']).toEqual(window.location.href);
  });

  test(`returns valid JSON-LD`, async () => {
    const earlReport = createEarlReport(dummyData);
    // have to typecast to any, to allow for usage of await, as otherwise the interface expects a callback argument
    await (jsonld as any).flatten(earlReport);
  });

  test(`loses no data when transformed with jsonld`, async () => {
    const earlReport = createEarlReport([
      {
        id: 'foo',
        description:
          'Ensures role attribute has an appropriate value for the element',
        helpUrl: 'https://dequeuniversity.com/rules/axe/3.1/foo'
      },
      {
        id: 'bar',
        description:
          'Ensures role attribute has an appropriate value for the element',
        helpUrl: 'https://dequeuniversity.com/rules/axe/3.1/bar',
        passes: [
          {
            node: { selector: ['#foo'] }
          }
        ]
      },
      {
        id: 'baz',
        description: 'Ensures baz',
        helpUrl: 'https://dequeuniversity.com/rules/axe/3.1/baz',
        incomplete: [
          {
            node: { selector: ['#foo'] }
          }
        ]
      }
    ]);

    const context = {
      earl: 'http://www.w3.org/ns/earl#',
      sch: 'https://schema.org/',
      dct: 'http://purl.org/dc/terms#',
      'axe-version': 'https://github.com/dequelabs/axe-core/releases/tag/',
      'dqu-page': 'https://dequeuniversity.com/rules/axe/'
    };

    // have to typecast to any, to allow for usage of await, as otherwise the interface expects a callback argument
    const compact = await (jsonld as any).compact(earlReport, context);
    expect(compact).toEqual({
      '@context': context,
      '@type': 'sch:WebPage',
      'dct:source': window.location.href,
      '@reverse': {
        'earl:subject': [
          {
            '@type': 'earl:Assertion',
            'earl:assertedBy': {
              '@id': 'axe-version:3.1.0',
              '@type': [
                'earl:Assertor',
                'earl:Software',
                'http://usefulinc.com/ns/doap#Project'
              ],
              'http://usefulinc.com/ns/doap#name': 'Axe',
              'http://usefulinc.com/ns/doap#vendor': {
                '@id': 'https://deque.com/',
                '@type': 'http://xmlns.com/foaf/spec/#Organization',
                'http://xmlns.com/foaf/spec/#name': 'Deque Systems'
              }
            },
            'earl:mode': { '@id': 'earl:automatic' },
            'earl:result': {
              '@type': 'earl:TestResult',
              'earl:outcome': { '@id': 'earl:inapplicable' }
            },
            'earl:test': {
              '@id': 'dqu-page:3.1/foo',
              '@type': 'earl:TestCase'
            }
          },
          {
            '@type': 'earl:Assertion',
            'earl:assertedBy': {
              '@id': 'axe-version:3.1.0',
              '@type': [
                'earl:Assertor',
                'earl:Software',
                'http://usefulinc.com/ns/doap#Project'
              ],
              'http://usefulinc.com/ns/doap#name': 'Axe',
              'http://usefulinc.com/ns/doap#vendor': {
                '@id': 'https://deque.com/',
                '@type': 'http://xmlns.com/foaf/spec/#Organization',
                'http://xmlns.com/foaf/spec/#name': 'Deque Systems'
              }
            },
            'earl:mode': { '@id': 'earl:automatic' },
            'earl:result': {
              '@type': 'earl:TestResult',
              'earl:info':
                'Ensures role attribute has an appropriate value for the element',
              'earl:outcome': { '@id': 'earl:undefined' },
              'earl:pointer': {
                '@type': 'ptr:CSSSelectorPointer',
                '@value': '#foo'
              }
            },
            'earl:test': {
              '@id': 'dqu-page:3.1/bar',
              '@type': 'earl:TestCase'
            }
          },
          {
            '@type': 'earl:Assertion',
            'earl:assertedBy': {
              '@id': 'axe-version:3.1.0',
              '@type': [
                'earl:Assertor',
                'earl:Software',
                'http://usefulinc.com/ns/doap#Project'
              ],
              'http://usefulinc.com/ns/doap#name': 'Axe',
              'http://usefulinc.com/ns/doap#vendor': {
                '@id': 'https://deque.com/',
                '@type': 'http://xmlns.com/foaf/spec/#Organization',
                'http://xmlns.com/foaf/spec/#name': 'Deque Systems'
              }
            },
            'earl:mode': { '@id': 'earl:automatic' },
            'earl:result': {
              '@type': 'earl:TestResult',
              'earl:info': 'Ensures baz',
              'earl:outcome': { '@id': 'earl:undefined' },
              'earl:pointer': {
                '@type': 'ptr:CSSSelectorPointer',
                '@value': '#foo'
              }
            },
            'earl:test': {
              '@id': 'dqu-page:3.1/baz',
              '@type': 'earl:TestCase'
            }
          }
        ]
      }
    });
  });
});

describe(`axeReporterEarl`, () => {
  test(`runs with axe-core`, async () => {
    document.body.innerHTML = `
      <h1>My page </h1>
      <main>
        <p>Some page</p>
        <p><input type="text"> Failing input field</p>
      </main>
    `;
    // Run axe
    const params: any = {
      reporter: axeReporterEarl
    };
    const earlResults: axe.AxeResults | any = await axe.run(params);
    expect(earlResults['@context']).toBeDefined();
  });
});
