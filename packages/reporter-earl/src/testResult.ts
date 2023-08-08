import {
  RawResult,
  RawNodeResult,
  TestResult,
  Selector,
  EarlType
} from './types';

export function cssToPointer(selector: Selector): string {
  const item = selector[0];
  if (Array.isArray(item)) {
    return item[0];
  }
  return item;
}

export default function testResult(
  { description }: RawResult,
  outcomes: RawNodeResult[] = []
): TestResult[] {
  return outcomes.map(({ node, result }): TestResult => {
    return {
      '@type': EarlType.TestResult,
      info: description,
      outcome: 'earl:' + result,
      pointer: cssToPointer(node.selector)
    };
  });
}
