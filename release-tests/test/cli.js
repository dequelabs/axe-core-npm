const { assert } = require('chai');
const execa = require('execa');
const CLI = require.resolve('@axe-core/cli/dist/src/bin/cli.js');
const { version } = require('@axe-core/cli/package.json');
const expectedVersion = require('../../packages/cli/package.json').version;

describe(`@axe-core/cli v${version}`, () => {
  it('matches the local version', () => {
    assert.equal(version, expectedVersion);
  });

  it('runs without errors', async () => {
    const result = await execa(CLI, ['dequeuniversity.com/demo/mars/']);
    assert.equal(result.exitCode, 0);
  });
});
