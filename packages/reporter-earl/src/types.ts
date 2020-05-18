export enum EarlType {
  WebPage = 'WebPage',
  Assertion = 'Assertion',
  TestCase = 'TestCase',
  TestResult = 'TestResult'
}

export interface EarlResult {
  '@context': object;
  '@type': EarlType.WebPage;
  url: string;
  assertions: Assertion[];
}

type outcome =
  | 'earl:inapplicable'
  | 'earl:passed'
  | 'earl:incomplete'
  | 'earl:failed';

export interface Assertion {
  '@type': EarlType.Assertion;
  mode: 'earl:automatic';
  assertedBy: {};
  test: {
    '@type': EarlType.TestCase;
    '@id': string;
  };
  result: TestResult;
}

export interface TestResult {
  '@type': EarlType.TestResult;
  outcome: string;
  pointer?: string;
  info?: string;
}

export interface RawResult {
  id: string;
  helpUrl: string;
  description: string;
  violations?: RawNodeResult[];
  passes?: RawNodeResult[];
  incomplete?: RawNodeResult[];
}

export interface RawNodeResult {
  node: {
    selector: Selector;
  };
  result?: 'passed' | 'failed' | 'inapplicable' | 'incomplete';
}

export type SelectorItem = string[] | string;

export type Selector = SelectorItem[];
