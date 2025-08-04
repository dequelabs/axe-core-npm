import fs from 'fs';
import path from 'path';
import colors from 'colors';
import type { AxeResults, UnlabelledFrameSelector } from 'axe-core';
import { config } from 'dotenv';
import os from 'os';

const HOME_DIR = os.homedir();
const BDM_CACHE_DIR = path.resolve(HOME_DIR, '.browser-driver-manager');

config({ path: path.resolve(BDM_CACHE_DIR, '.env') });

export const { CHROME_TEST_PATH, CHROMEDRIVER_TEST_PATH } = process.env;

export const saveOutcome = (
  outcome: AxeResults | AxeResults[],
  fileName?: string,
  dir?: string
): string => {
  if (typeof fileName !== 'string') {
    fileName = 'axe-results-' + Date.now() + '.json';
  }
  /* istanbul ignore if */
  if (typeof dir !== 'string') {
    dir = process.cwd();
  } else if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }

  const filePath = path.join(dir, fileName);

  /* istanbul ignore else */
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(outcome, null, 2), 'utf-8');
  return filePath;
};

export const parseUrl = (url: string): string => {
  if (!/[a-z]+:\/\//.test(url)) {
    return 'http://' + url;
  }
  return url;
};

/**
 * Convert a user provided browser name into a normalized form
 * for internal use. Conversion is case-insensitive. If no browser
 * is provided, it defaults to 'chrome-headless'.
 */
export const parseBrowser = (browser?: string): string | Error => {
  if (!browser) {
    return 'chrome-headless';
  }

  switch (browser.toLowerCase()) {
    case 'ff':
    case 'firefox':
    case 'gecko':
    case 'marionette':
      return 'firefox';

    case 'chrome':
      return 'chrome';

    case 'ie':
    case 'explorer':
    case 'internetexplorer':
    case 'internet_explorer':
    case 'internet-explorer':
      return 'ie';

    case 'safari':
      return 'safari';

    case 'edge':
    case 'microsoftedge':
      return 'MicrosoftEdge';

    default:
      throw new Error('Unknown browser ' + browser);
  }
};

export const getAxeSource = (
  axePath?: string,
  dirname?: string
): string | void => {
  // Abort if axePath should exist, and it isn't
  if (axePath && !fs.existsSync(axePath)) {
    return;
  }

  let cwd = dirname;
  if (!cwd) {
    cwd = process.cwd();
  }

  if (!dirname) {
    dirname = __dirname;
  }

  // Look for axe in current working directory
  if (!axePath) {
    axePath = path.join(cwd, 'axe.js');
  }

  if (!fs.existsSync(axePath)) {
    // Look for axe in CWD ./node_modules
    axePath = path.join(cwd, 'node_modules', 'axe-core', 'axe.js');
  }

  if (!fs.existsSync(axePath)) {
    // in local develop using npm workspaces axe-core is
    // hoisted to the root, but when published axe-core
    // will be in the node_modules for the cli
    axePath = require.resolve('axe-core/axe.js');
  }

  return fs.readFileSync(axePath, 'utf-8');
};

export const getAxeVersion = (source: string): string => {
  const match = source.match(/\.version\s*=\s'([^']+)'/);
  return match ? match[1] : 'unknown version';
};

export const splitList = (val: string): string[] => {
  return val.split(/[,;]/).map(str => str.trim());
};

export const selectorToString = (
  selectors: UnlabelledFrameSelector,
  separator?: string
): string => {
  separator = separator || ' ';
  return selectors
    .reduce((prev, curr) => prev.concat(curr as never), [])
    .join(separator);
};

export const reporter = (
  noReporter: boolean,
  silentMode: boolean
): (() => void) => {
  if (!noReporter || silentMode) {
    return () => {};
  } else {
    return (...args: string[]) => {
      console.log(...args);
    };
  }
};

export const link = colors.underline.blue;
export const error = colors.red.bold;
export const bold = colors.bold;
export const green = colors.green;
export const italics = colors.italic;
