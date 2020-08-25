import { RawResult, Assertion, TestResult, EarlType } from './types';
import testResults from './testResult';

export default function axeResultToEarl(rawResults: RawResult[]): Assertion[] {
  return rawResults.reduce(
    (asserts: Assertion[], axeResult: RawResult): Assertion[] => {
      let results: TestResult[] = [];
      results = results.concat(testResults(axeResult, axeResult.violations));
      results = results.concat(testResults(axeResult, axeResult.passes));
      results = results.concat(testResults(axeResult, axeResult.incomplete));

      if (results.length === 0) {
        results.push({
          '@type': EarlType.TestResult,
          outcome: 'earl:inapplicable'
        });
      }

      const newAsserts = results.map(
        (result): Assertion => {
          const match = axeResult.helpUrl.match(
            /axe\/([1-9][0-9]*\.[1-9][0-9]*)\//
          );
          const version = (match && match[1]) || '';
          return {
            '@type': EarlType.Assertion,
            mode: 'earl:automatic',
            assertedBy: {
              '@id': `https://github.com/dequelabs/axe-core/releases/tag/${version}.0`,
              '@type': ['earl:Assertor', 'earl:Software', 'doap:Project'],
              'doap:name': 'Axe',
              'doap:vendor': {
                '@id': 'https://deque.com/',
                '@type': 'foaf:Organization',
                'foaf:name': 'Deque Systems'
              }
            },
            test: {
              '@type': EarlType.TestCase,
              '@id': axeResult.helpUrl
            },
            result
          };
        }
      );

      return asserts.concat(newAsserts);
    },
    []
  );
}
