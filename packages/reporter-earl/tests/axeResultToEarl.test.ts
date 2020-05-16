import axeResultToEarl from '../src/axeResultToEarl';
import { getDummyData } from './utils';
import testResult from '../src/testResult';
import { RawResult, RawNodeResult } from '../src/types';

let dummyData: RawResult[];
beforeEach(async () => {
  dummyData = await getDummyData();
});

const resultTypes = ['violations', 'passes', 'incomplete'];
const outcomeMap = {
  violations: 'earl:failed',
  passes: 'earl:passed',
  incomplete: 'earl:cantTell'
};

test(`returns an array of assertions`, () => {
  expect(Array.isArray(dummyData)).toBe(true);
  expect(dummyData.length).not.toEqual(0);
  const assertions = axeResultToEarl(dummyData);
  expect(Array.isArray(assertions)).toBe(true);
  expect(assertions.length).not.toEqual(0);
});

test(`Assertions have {'assertedBy': Object }`, async () => {
  const dummyData = await getDummyData('20.10');
  const assertions = axeResultToEarl(dummyData);
  assertions.forEach(assertion => {
    const assertedBy = assertion['assertedBy'];
    expect(assertedBy).toBeDefined();
  });
});

test(`Assertions have {'test': { '@type': 'TestCase', '@id': helpUrl } }`, () => {
  const helpUrls = dummyData.map(({ helpUrl }) => helpUrl);
  const assertions = axeResultToEarl(dummyData);
  assertions.forEach(assertion => {
    expect(typeof assertion['test']).toBe('object');
    expect(helpUrls).toContain(assertion['test']['@id']);
  });
});

test(`Rules without results get an 'earl:inapplicable' assertion`, () => {
  const assertions = axeResultToEarl(dummyData);
  const inapplicableData = dummyData.filter(
    ({ violations, passes, incomplete }) => {
      return (
        (!violations || violations.length === 0) &&
        (!passes || passes.length === 0) &&
        (!incomplete || incomplete.length === 0)
      );
    }
  );
  expect(inapplicableData.length).not.toEqual(0);
  inapplicableData.forEach(ruleData => {
    const ruleAsserts = assertions.filter(assertion => {
      return assertion.test['@id'].includes(`/${ruleData.id}?`);
    });
    expect(ruleAsserts).toHaveLength(1);
    expect(ruleAsserts[0].result.outcome).toEqual('earl:inapplicable');
  });
});

resultTypes.forEach(type =>
  describe(`result type ${type}`, () => {
    test(`Assertions include all ${type}`, () => {
      const assertions = axeResultToEarl(dummyData);

      dummyData.forEach(ruleData => {
        const rawResult: RawNodeResult[] = (ruleData as any)[type];
        expect(rawResult).toBeDefined();
        const outcomeType: string = (outcomeMap as any)[type];
        expect(outcomeType).toBeDefined();

        const ruleAsserts = assertions
          .filter(assertion => {
            return assertion.test['@id'].includes(`/${ruleData.id}?`);
          })
          .filter(({ result }) => result.outcome === outcomeType);

        expect(rawResult.length).toEqual(ruleAsserts.length);

        const expectAssert = testResult(ruleData, rawResult);
        ruleAsserts.forEach(ruleAssert => {
          expect(expectAssert).toContainEqual(ruleAssert.result);
        });
      });
    });
  })
);
