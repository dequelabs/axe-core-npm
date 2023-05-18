import type { OptionValues } from 'commander';
import colors from 'colors';
import {
  parseBrowser,
  parseUrl,
  reporter,
  getAxeVersion,
  saveOutcome,
  bold,
  error,
  italics,
  link
} from '../lib/utils';
import axeTestUrls from '../lib/axe-test-urls';
import event from '../lib/events';
import { startDriver } from '../lib/webdriver';
import fs from 'fs';

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
    chromedriverPath
  } = args;

  const showErrors = args.showErrors === true;
  const silentMode = !!stdout;
  const axeSourcePath = args.axeSource || require.resolve('axe-core');
  let axeSource;

  try {
    axeSource = fs.readFileSync(axeSourcePath, 'utf-8');
  } catch (err) {
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
    chromedriverPath
  };

  args.driver = startDriver(driverConfigs);

  const cliReporter = reporter(noReporter, silentMode);
  const axeVersion = getAxeVersion(axeSource);
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
    axeSource,
    include,
    exclude,
    tags,
    rules,
    disable
  };
  try {
    const outcome = await axeTestUrls(urls, testPageConfigParams, events);
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
