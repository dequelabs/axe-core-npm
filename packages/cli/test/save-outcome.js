'use strict';
const fs = require('fs');
const path = require('path');
const { assert } = require('chai');
const rimraf = require('rimraf');
const saveOutcome = require('../lib/save-outcome');

describe('saveOutcome()', () => {
  const newDir = path.join(process.cwd(), 'testoutput');
  // clean up
  afterEach(() => {
    if (fs.existsSync(newDir)) {
      rimraf.sync(newDir);
    }
  });
  it('creates a directory when one does not exist', async () => {
    const outcome = {
      foo: 'bar'
    };
    await saveOutcome(outcome, null, 'testoutput');
    assert.isTrue(fs.existsSync(newDir));
  });
});
