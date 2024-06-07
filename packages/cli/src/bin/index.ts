import type { OptionValues } from 'commander';
import colors from 'colors';
import {
  parseBrowser,
  parseUrl,
  reporter,
  getAxeVersion,
  getAxeSource,
  saveOutcome,
  bold,
  error,
  italics,
  link
} from '../lib/utils';
import axeTestUrls from '../lib/axe-test-urls';
import event from '../lib/events';
import { startDriver } from '../lib/webdriver';
import { error as selenium_error } from 'selenium-webdriver';

const cli = async (
  args: OptionValues,
  url: { args: string[] }
): Promise<void> => {
  const {
    save,
    stdout,
    dir,
    exit,
    timer,
    reporter: noReporter,
    chromeOptions,
    verbose,
    timeout,
    include,
    exclude,
    tags,
    rules,
    disable,
    loadDelay,
    chromedriverPath,
    chromePath
  } = args;

  const showErrors = args.showErrors === true;

  const silentMode = !!stdout;
  args.axeSource = getAxeSource(args.axeSource);

  if (!args.axeSource) {
    console.error(error('Unable to find the axe-core source file'));
    process.exit(2);
  }

  args.browser = parseBrowser(args.browser);
  /* istanbul ignore if */
  if (chromeOptions) {
    /* istanbul ignore if */
    if (args.browser !== 'chrome-headless') {
      console.error(
        error(
          'You may only provide --chrome-options when using headless chrome'
        )
      );
      process.exit(2);
    }
  }

  const driverConfigs = {
    browser: args.browser,
    timeout,
    chromeOptions,
    chromedriverPath,
    chromePath
  };

  args.driver = startDriver(driverConfigs);

  const cliReporter = reporter(noReporter, silentMode);
  const axeVersion = getAxeVersion(args.axeSource);
  if (!silentMode) {
    console.log(
      colors.bold('Running axe-core ' + axeVersion + ' in ' + args.browser)
    );
  }

  const urls = url.args.map(parseUrl);

  /* istanbul ignore if */
  if (urls.length === 0) {
    console.error(error('No url was specified. Check `axe --help` for help\n'));
  }

  const events = event({
    silentMode,
    timer,
    cliReporter,
    verbose,
    exit
  });

  const testPageConfigParams = {
    driver: args.driver,
    timer,
    loadDelay,
    axeSource: args.axeSource,
    include,
    exclude,
    tags,
    rules,
    disable
  };
  let outcome;
  try {
    try {
      outcome = await axeTestUrls(urls, testPageConfigParams, events);
    } catch (e) {
      if (e instanceof selenium_error.ScriptTimeoutError) {
        console.error(error('Error: %s'), e.message);
        console.log(
          `The timeout is currently configured to be ${timeout} seconds (you can change it with --timeout).`
        );
        process.exit(2);
      }
      // Provide a more user-friendly error message when there's a ChromeDriver/Chrome version mismatch.
      else if (
        e instanceof selenium_error.SessionNotCreatedError &&
        e.message.includes(
          'This version of ChromeDriver only supports'
          // This string has to match the error message printed by chromedriver, see
          // https://chromium.googlesource.com/chromium/src/+/refs/tags/110.0.5481.194/chrome/test/chromedriver/chrome_launcher.cc#300.
        )
      ) {
        console.error(error('Error: %s'), e.message);
        console.log(`\nPlease use browser-driver-manager to install matching versions of Chrome and ChromeDriver:
        
        $ npx browser-driver-manager install chrome
        
        This will install the latest synced versions. You may install specific synced versions using 
        
        $ npx browser-driver-manager install chrome@<version>

        where <version> is a specific version, e.g. 123.45.67, or a channel, e.g. canary.

        You may also pass the \`--chromedriver-path\` option to axe:

        $ axe --chromedriver-path <path/to/chromedriver-executable>`);
        process.exit(2);
      } else {
        throw e;
      }
    }
    if (silentMode) {
      process.stdout.write(JSON.stringify(outcome, null, 2));
      return;
    }

    if (timer) {
      console.timeEnd('Total test time');
    }

    /* istanbul ignore if */
    if (Array.isArray(outcome)) {
      console.log(bold('Testing complete of %d pages\n'), outcome.length);
    }

    if (save || dir) {
      try {
        const fileName = saveOutcome(outcome, save, dir);
        console.log('Saved file at', fileName, '\n');
      } catch (e) {
        /* istanbul ignore next */
        console.error(error('Unable to save file!\n') + e);
        process.exit(1);
      }
    }

    if (exit) {
      let exitErr = false;
      /* istanbul ignore if */
      if (Array.isArray(outcome)) {
        for (const res of outcome) {
          if (res.violations.length > 0) {
            exitErr = true;
            break;
          }
        }
      } else {
        exitErr = outcome.violations.length > 0;
      }
      if (exitErr) {
        process.exit(1);
      }
    }

    /* istanbul ignore if */
    if (silentMode) {
      return;
    }

    console.log(
      italics(
        'Please note that only 20% to 50% of all accessibility ' +
          'issues can automatically be detected. \nManual testing is ' +
          'always required. For more information see:\n%s\n'
      ),
      link('https://dequeuniversity.com/curriculum/courses/testingmethods')
    );
  } catch (e) {
    /* istanbul ignore else */
    if (!showErrors) {
      console.error(error('An error occurred while testing this page.'));
    } else {
      console.error(error('Error: %s'), e);
    }

    console.error(
      'Please report the problem to: ' +
        link('https://github.com/dequelabs/axe-core-npm/issues/') +
        '\n'
    );
    process.exit(1);
  }
};

export default cli;
