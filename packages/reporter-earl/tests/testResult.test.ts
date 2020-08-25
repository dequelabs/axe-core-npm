import testResult, { cssToPointer } from '../src/testResult';
import { getDummyData } from './utils';
import { RawResult, RawNodeResult, EarlType } from '../src/types';

let dummyData: RawResult[];
beforeEach(async () => {
  dummyData = await getDummyData();
});

const resultTypes: ResultType[] = ['violations', 'passes', 'incomplete'];
const outcomeMap = {
  violations: 'earl:failed',
  passes: 'earl:passed',
  incomplete: 'earl:cantTell'
};

type ResultType = 'violations' | 'passes' | 'incomplete';
type ResultCallback = (
  axeResult: RawResult,
  nodeResults: RawNodeResult[],
  type: ResultType
) => void;

function eachResult(callback: ResultCallback): void {
  dummyData.forEach(axeResult => {
    resultTypes.forEach((type: ResultType) => {
      const nodeResults = axeResult[type];
      if (nodeResults && nodeResults.length) {
        callback(axeResult, nodeResults, type);
      }
    });
  });
}

test(`returns an array of TestResult objects`, () => {
  eachResult((axeResult, nodeResults) => {
    const results = testResult(axeResult, nodeResults);
    results.forEach(result => {
      expect(result['@type']).toEqual(EarlType.TestResult);
    });
  });
});

test(`TestResult has 'outcome'`, () => {
  eachResult((axeResult, nodeResults, type) => {
    expect(outcomeMap[type]).toBeDefined();
    const results = testResult(axeResult, nodeResults);
    results.forEach(result => {
      expect(result['outcome']).toEqual(outcomeMap[type]);
    });
  });
});

test(`TestResult has 'info'`, () => {
  eachResult((axeResult, nodeResults) => {
    expect(axeResult.description).toBeDefined();
    const results = testResult(axeResult, nodeResults);
    results.forEach(result => {
      expect(result['info']).toEqual(axeResult.description);
    });
  });
});

test(`TestResult has 'pointer'`, () => {
  eachResult((axeResult, nodeResults) => {
    expect(axeResult.description).toBeDefined();
    const results = testResult(axeResult, nodeResults);
    const pointers = nodeResults.map(({ node }) =>
      Array.isArray(node.selector[0]) ? node.selector[0][0] : node.selector[0]
    );
    results.forEach(result => {
      expect(pointers).toContain(result['pointer']);
    });
  });
});

describe(`cssToPointer`, () => {
  test(`returns the first item of an array`, () => {
    expect(cssToPointer(['foo', 'bar'])).toEqual('foo');
  });

  test(`returns the first item of a nested array`, () => {
    expect(cssToPointer([['foo', 'bar'], 'baz'])).toEqual('foo');
  });
});
