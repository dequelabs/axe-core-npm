import 'mocha';
import { assert } from 'chai';
import events from './events';

describe('events()', () => {
  const event = events({
    silentMode: false,
    timer: false,
    cliReporter: () => {},
    verbose: false,
    exit: false
  });
  const functions = [
    'startTimer',
    'endTimer',
    'waitingMessage',
    'onTestStart',
    'onTestComplete'
  ] as const;
  for (const eventFunction of functions) {
    it(`${eventFunction} is a typeof function`, () => {
      assert.isFunction(event[eventFunction]);
    });
  }
});
