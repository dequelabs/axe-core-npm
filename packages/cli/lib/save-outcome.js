'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function saveOutcome(outcome, fileName, dir) {
  return new Promise((resolve, reject) => {
    if (typeof fileName !== 'string') {
      fileName = 'axe-results-' + Date.now() + '.json';
    }

    if (typeof dir !== 'string') {
      dir = process.cwd();
    } else if (!path.isAbsolute(dir)) {
      dir = path.join(process.cwd(), dir);
    }

    const filePath = path.join(dir, fileName);
    fs.writeFile(filePath, JSON.stringify(outcome, null, '  '), 'utf8', err => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
};
