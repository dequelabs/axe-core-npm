import type { AxeResults } from 'axe-core';
import type { EventParams } from '../types';
import { selectorToString, error, link, bold, green } from './utils';

export default ({
  silentMode,
  timer,
  cliReporter,
  verbose,
  exit
}: EventParams) => {
  return {
    startTimer: (message: string) => {
      console.time(message);
    },
    endTimer: (message: string) => {
      console.timeEnd(message);
    },
    waitingMessage: (loadDelayTime: number) => {
      console.log(
        'Waiting for ' + loadDelayTime + ' milliseconds after page loads...'
      );
    },
    onTestStart: (url: string) => {
      if (silentMode) {
        return;
      }
      console.log(
        bold('\nTesting ' + link(url)) +
          ' ... please wait, this may take a minute.'
      );
      if (timer) {
        console.time('Total test time');
      }
    },
    onTestComplete: (results: AxeResults) => {
      const { violations, testEngine, testEnvironment, testRunner } = results;

      /* istanbul ignore if */
      if (violations.length === 0) {
        cliReporter(green(' 0 violations found!'));
        return;
      }

      const issueCount = violations.reduce((count, violation) => {
        cliReporter(
          '\n' +
            error('  Violation of %j with %d occurrences!\n') +
            '    %s. Correct invalid elements at:\n' +
            violation.nodes
              .map(node => '     - ' + selectorToString(node.target) + '\n')
              .join('') +
            '    For details, see: %s',
          violation.id,
          violation.nodes.length,
          violation.description,
          link(violation.helpUrl.split('?')[0])
        );
        return count + violation.nodes.length;
      }, 0);

      cliReporter(error('\n%d Accessibility issues detected.'), issueCount);

      if (verbose) {
        const metadata = {
          'Test Runner': testRunner,
          'Test Engine': testEngine,
          'Test Environment': testEnvironment
        };
        cliReporter(`\n${JSON.stringify(metadata, null, 2)}`);
      }

      if (exit) {
        process.exit(1);
      }
    }
  };
};
