require('mocha');
const { assert } = require('chai');
const AxeBuilder = require('../dist');

describe('axe-webdriverjs', () => {
  it('should return an axeBuilder object', () => {
    assert.isFunction(AxeBuilder);
  });
});
