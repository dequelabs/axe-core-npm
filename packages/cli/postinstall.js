#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const adtAbsolutePath = path.join(
  process.cwd(),
  'node_modules',
  '@axe-devtools',
  'cli',
  'cli.js'
);

const adtExist = fs.existsSync(adtAbsolutePath);

// validate that axe-devtools/cli exist
if (adtExist) {
  const axeSymlink = fs.readlinkSync(
    path.join(process.cwd(), 'node_modules', '.bin', 'axe')
  );

  if (axeSymlink.match(/\s*?(@axe-core)/g)) {
    const axeCoreCliPath = path.join(
      process.cwd(),
      'node_modules',
      '.bin',
      'axe'
    );
    const adtRelativePath = path.relative(
      path.join(process.cwd(), 'node_modules', '.bin'),
      adtAbsolutePath
    );

    fs.unlinkSync(axeCoreCliPath);
    fs.symlinkSync(adtRelativePath, axeCoreCliPath);
    console.warn(
      'Please make sure to uninstall @axe-core/cli in favor of having @axe-devtools/cli'
    );
  }
}
