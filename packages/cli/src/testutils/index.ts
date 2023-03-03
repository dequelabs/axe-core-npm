import execa from 'execa';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
let dirname: string;
if (typeof __dirname === 'undefined') {
  // utilities for ESM to use __dirname
  const filename = fileURLToPath(import.meta.url);
  dirname = path.dirname(filename);
} else {
  dirname = __dirname;
}
// utilities for ESM to use require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const TS_NODE = require.resolve('ts-node/dist/bin.js');
const CLI = path.resolve(dirname, '..', 'bin', 'cli.ts');
const PROJECT_FILE = path.join(dirname, '..', 'tsconfig.json');

/**
 * Run the CLI with the given `args`.
 *
 * Will not reject if the CLI exits with a non-zero exit code. It is expected that you check the `.exitCode` value yourself.
 *
 * @param args CLI arguments to pass
 */

const runCLI = (...args: string[]): Promise<execa.ExecaChildProcess<string>> =>
  runCLIWithOptions(args, { reject: false });

export default runCLI;

/**
 * Run the CLI with the given `args` and `options`.
 *
 * Set `DEBUG_CLI_TESTS` for additional debugging support (logging).
 *
 * @param args CLI arguments to pass
 * @param options Options for `execa`
 */

export const runCLIWithOptions = async (
  args: string[],
  options: execa.Options
): Promise<execa.ExecaChildProcess<string>> => {
  if ('DEBUG_CLI_TESTS' in process.env) {
    console.log('cli', args.join(' '));
  }

  const result = await execa(
    TS_NODE,
    ['--experimental-specifier-resolution=node', '--esm', CLI, ...args],
    options
  );

  if ('DEBUG_CLI_TESTS' in process.env) {
    fs.writeFileSync('./stdout.txt', result.stdout);
    fs.writeFileSync('./stderr.txt', result.stderr);
  }

  return result;
};
