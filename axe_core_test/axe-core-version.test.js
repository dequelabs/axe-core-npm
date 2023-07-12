const assert = require('assert');
const glob = require('glob');
const semver = require('semver');

for (const pkgFile of glob.sync('../packages/*/package.json')) {
  const pkg = require(pkgFile);
  const axeDependency = pkg.dependencies?.['axe-core'];

  const testFn = axeDependency ? it : it.skip;

  describe(pkg.name, () => {
    testFn(
      'should have the same semver major/minor as its axe-core dependency',
      () => {
        const axeVersion = semver.parse(semver.coerce(axeDependency));
        const pkgVersion = semver.parse(pkg.version);

        assert.equal(axeVersion.major, pkgVersion.major);
        assert.equal(axeVersion.minor, pkgVersion.minor);
      }
    );
  });
}
