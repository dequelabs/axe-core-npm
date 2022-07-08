import { RawResult, EarlResult, EarlType } from './types';
import * as context from './context.json';
import axeResultToAssertion from './axeResultToEarl';

export function createEarlReport(
  rawResults: RawResult[],
  url?: string
): EarlResult {
  return {
    '@context': context,
    '@type': EarlType.WebPage,
    url: url ? url : window.location.href,
    assertions: axeResultToAssertion(rawResults)
  };
}

export default function axeReporterEarl(
  rawResults: RawResult[],
  {},
  callback: Function
): void {
  callback(createEarlReport(rawResults));
}
