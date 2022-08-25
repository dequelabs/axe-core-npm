#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../../package.json';
import { splitList } from '../lib/utils';
import cli from '.';

const program = new Command();

program
  .version(version)
  .usage('<url...> [options]')
  .option(
    '-i, --include <list>',
    'CSS selector of included elements, comma separated',
    splitList
  )
  .option(
    '-e, --exclude <list>',
    'CSS selector of excluded elements, comma separated',
    splitList
  )
  .option(
    '-r, --rules <list>',
    'IDs of rules to run, comma separated',
    splitList
  )
  .option(
    '-t, --tags <list>',
    'Tags of rules to run, comma separated',
    splitList
  )
  .option(
    '-l, --disable <list>',
    'IDs of rules to disable, comma separated',
    splitList
  )
  .option(
    '-b, --browser [browser-name]',
    'Which browser to run (Webdriver required)'
  )
  .option(
    '-s, --save [filename]',
    'Save the output as a JSON file. Filename is optional'
  )
  .option(
    '-j, --stdout',
    'Output results to STDOUT and silence all other output'
  )
  .option('-d, --dir <path>', 'Output directory')
  .option('-a, --axe-source <path>', 'Path to axe.js file')
  .option('-q, --exit', 'Exit with `1` failure code if any a11y tests fail')
  .option(
    '-v, --verbose',
    'Output metadata like test tool name, version and environment'
  )
  .option(
    '--load-delay <n>',
    'Set how much time (milliseconds) axe will wait after page load before running the audit (default: 0)'
  )
  .option(
    '--timeout <n>',
    'Set how much time (seconds) axe has to run (default: 90)'
  )
  .option('--timer', 'Log the time it takes to run')
  .option('--show-errors <boolean>', 'Display the full error stack', true)
  // TODO: Replace this with a reporter option, this required adding
  .option('--no-reporter', 'Turn the CLI reporter off')
  .option(
    '--chrome-options [options]',
    'Options to provide to headless Chrome',
    splitList
  )
  .option(
    '--chromedriver-path <path>',
    'Absolute path to the desired chromedriver executable'
  )
  .action(cli);

program.parse(process.argv);
