const assert = require('assert');
const execa = require('execa');
const CLI = require.resolve('@axe-core/cli/dist/src/bin/cli.js');
const { version } = require('@axe-core/cli/package.json');

describe(`@axe-core/cli v${version}`, () => {
  it('runs without errors', async () => {
    const result = await execa(CLI, ['dequeuniversity.com/demo/mars/']);
    assert(
      result.exitCode === 0,
      `Assert exit code to be 0, received ${result.exitCode}`
    );
  });
});
