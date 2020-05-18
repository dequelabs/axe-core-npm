const assert = require('chai').assert;

const normalizeContext = require('../../lib/normalize-context');
describe('normalize-context', function () {
  it('should return null if there are no includes or excludes', function () {
    assert.isNull(normalizeContext([], []));
  });

  it('should return an object with only includes if excludes are empty', function () {
    const result = normalizeContext(['bob', 'fred', 'joe'], []);
    assert.deepEqual(result, {
      include: ['bob', 'fred', 'joe']
    });
  });

  it('should return an object with only excludes if includes are empty', function () {
    const result = normalizeContext([], ['bob', 'fred', 'joe']);
    assert.deepEqual(result, {
      exclude: ['bob', 'fred', 'joe']
    });
  });

  it('should other return an object with both include and excludes', function () {
    const result = normalizeContext(['sally', 'susan'], ['bob', 'fred', 'joe']);
    assert.deepEqual(result, {
      include: ['sally', 'susan'],
      exclude: ['bob', 'fred', 'joe']
    });
  });
});
