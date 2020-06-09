'use strict';

const program = require('commander');
const colors = require('colors');
const link = colors.underline.blue;
const error = colors.red.bold;
const version = require('./package.json').version;
const axeTestUrls = require('./lib/axe-test-urls');
const saveOutcome = require('./lib/save-outcome');
const utils = require('./lib/utils');
const { startDriver } = require('./webdriver');

program
  .version(version)
  .usage('<url...> [options]')
  .option(
    '-i, --include <list>',
    'CSS selector of included elements, comma separated',
    utils.splitList
  )
  .option(
    '-e, --exclude <list>',
    'CSS selector of included elements, comma separated',
    utils.splitList
  )
  .option(
    '-r, --rules <list>',
    'IDs of rules to run, comma separated',
    utils.splitList
  )
  .option(
    '-t, --tags <list>',
    'Tags of rules to run, comma separated',
    utils.splitList
  )
  .option(
    '-l, --disable <list>',
    'IDs of rules to disable, comma separated',
    utils.splitList
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
    '--load-delay <n>',
    'Set how much time (milliseconds) axe will wait after page load before running the audit (default: 0)',
    0
  )
  .option(
    '--timeout <n>',
    'Set how much time (seconds) axe has to run (default: 90)',
    90
  )
  .option('--timer', 'Log the time it takes to run')
  .option('--show-errors', 'Display the full error stack')
  // TODO: Replace this with a reporter option, this required adding
  // a reporter option to axe-webdriverjs
  .option('--no-reporter', 'Turn the CLI reporter off')
  .option(
    '--chrome-options [options]',
    'Options to provide to headless Chrome',
    utils.splitList
  )
  .option(
    '-v, --verbose',
    'Output metadata like test tool name, version and environment'
  )
  .option(
    '--chromedriver-path <path>',
    'Absolute path to the desired chromedriver executable'
  )
  .parse(process.argv);

const silentMode = !!program.stdout;

program.browser = utils.parseBrowser(program.browser);
program.axeSource = utils.getAxeSource(program.axeSource);
program.driver = startDriver(program);

if (!program.axeSource) {
  console.error(error('Unable to find the axe-core source file.'));
  return;
}

if (program.chromeOptions) {
  if (program.browser !== 'chrome-headless') {
    console.error(
      error('You may only provide --chrome-options when using headless chrome')
    );
    process.exit(2);
  }

  program.chromeOptions = program.chromeOptions.map(option => `--${option}`);
}

let cliReporter;
if (program.reporter === false || silentMode) {
  cliReporter = function () {};
} else {
  cliReporter = function (...args) {
    console.log(...args);
  };
}

// Try to match the version of axe that's used
const axeVersion = utils.getAxeVersion(program.axeSource);

if (!silentMode) {
  // Setup axe with the appropriate config
  console.log(
    colors.bold('Running axe-core ' + axeVersion + ' in ' + program.browser)
  );
}

// Make valid URLs of all pages
const urls = program.args.map(utils.parseUrl);

if (urls.length === 0) {
  console.error(error('No url was specified. Check `axe -h` for help\n'));
  process.exitCode = 1;
  return;
}

// Run axe inside the pages
axeTestUrls(urls, program, {
  /**
   * Start a timer with a message
   */
  startTimer: function (message) {
    console.time(message);
  },

  /**
   * End timer with a message
   */
  endTimer: function (message) {
    console.timeEnd(message);
  },

  /**
   * Message of how long to wait after a page is loaded
   */

  waitingMessage: function (loadDelayTime) {
    console.log(
      'Waiting for ' + loadDelayTime + ' milliseconds after page load...'
    );
  },

  /**
   * Inform the user what page is tested
   */
  onTestStart: function (url) {
    if (silentMode) {
      return;
    }

    console.log(
      colors.bold('\nTesting ' + link(url)) +
        ' ... please wait, this may take a minute.'
    );
    if (program.timer) {
      console.time('Total test time');
    }
  },

  /**
   * Put the result in the console
   */
  onTestComplete: function logResults(results) {
    const { violations, testEngine, testEnvironment, testRunner } = results;

    if (violations.length === 0) {
      cliReporter(colors.green('  0 violations found!'));
      return;
    }

    const issueCount = violations.reduce((count, violation) => {
      cliReporter(
        '\n' +
          error('  Violation of %j with %d occurrences!\n') +
          '    %s. Correct invalid elements at:\n' +
          violation.nodes
            .map(node => '     - ' + utils.selectorToString(node.target) + '\n')
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

    if (program.verbose) {
      const metadata = {
        'Test Runner': testRunner,
        'Test Engine': testEngine,
        'Test Environment': testEnvironment
      };
      cliReporter(`\n${JSON.stringify(metadata, null, 2)}`);
    }

    if (program.exit) {
      process.exitCode = 1;
    }
  }
})
  .then(function (outcome) {
    if (silentMode) {
      process.stdout.write(JSON.stringify(outcome, null, 2));
      return;
    }

    console.log('');
    if (program.timer) {
      console.timeEnd('Total test time');
    }
    // All results are in, quit the browser, and give a final report
    if (outcome.length > 1) {
      console.log(
        colors.bold.underline('Testing complete of %d pages\n'),
        outcome.length
      );
    } else if (program.timer) {
      console.log('');
    }

    // Save the outcome
    if (program.save || program.dir) {
      return saveOutcome(outcome, program.save, program.dir)
        .then(fileName => {
          console.log('Saved file at', fileName, '\n');
        })
        .catch(err => {
          console.error(error('Unable to save file!\n') + err);
          process.exitCode = 1;
          return Promise.resolve();
        });
    } else {
      return Promise.resolve();
    }
  })
  .then(() => {
    if (silentMode) {
      return;
    }
    // Give a notification that 0 issues in axe doesn't mean perfect a11y
    console.log(
      colors.italic(
        'Please note that only 20% to 50% of all accessibility ' +
          'issues can automatically be detected. \nManual testing is ' +
          'always required. For more information see:\n%s\n'
      ),
      link('https://dequeuniversity.com/curriculum/courses/testingmethods')
    );
  })
  .catch(e => {
    console.error(' ');
    if (!program['show-errors']) {
      console.error(error('An error occurred while testing this page.'));
    } else {
      console.error(error('Error: %j \n $s'), e.message, e.stack);
    }

    console.error(
      'Please report the problem to: ' +
        link('https://github.com/dequelabs/axe-cli/issues/') +
        '\n'
    );
    process.exit(1);
  });
