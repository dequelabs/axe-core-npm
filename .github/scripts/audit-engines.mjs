#!/usr/bin/env node
/**
 * Fails when a package's production or peer dependency declares an
 * `engines.node` range that our own `engines.node` is not fully contained by —
 * i.e. we advertise support for a Node version the dependency does not.
 */
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Published packages only — a test workspace's engines.node is not a contract.
const packagesDir = join(repoRoot, 'packages');

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

/**
 * Walk up node_modules directories the way Node's resolver would, stopping at
 * the repo root so a stray node_modules above the checkout can't be audited.
 */
const findDependencyManifest = (fromDir, name) => {
  let dir = fromDir;
  while (true) {
    const manifest = join(dir, 'node_modules', name, 'package.json');
    if (existsSync(manifest)) {
      return manifest;
    }
    const parent = dirname(dir);
    if (dir === repoRoot || parent === dir) {
      return null;
    }
    dir = parent;
  }
};

/** Manifest values are third-party text; keep them inside their table cell. */
const cell = value =>
  String(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\|/g, '\\|')
    .slice(0, 120);

const results = [];

for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const pkgDir = join(packagesDir, entry.name);
  let pkg;

  try {
    pkg = readJson(join(pkgDir, 'package.json'));
  } catch (error) {
    results.push({
      status: 'fail',
      pkg: entry.name,
      dependency: '—',
      range: '—',
      detail: `unreadable package.json: ${error.message}`
    });
    continue;
  }

  const ourRange = pkg.engines?.node;

  if (!ourRange || !semver.validRange(ourRange)) {
    results.push({
      status: 'fail',
      pkg: pkg.name,
      dependency: '—',
      range: '—',
      detail: ourRange
        ? `unparseable engines.node: ${ourRange}`
        : 'package declares no engines.node'
    });
    continue;
  }

  const dependencies = [
    ...Object.keys(pkg.dependencies ?? {}).map(name => [name, 'dependency']),
    ...Object.keys(pkg.peerDependencies ?? {}).map(name => [
      name,
      'peer dependency'
    ])
  ];

  for (const [name, kind] of dependencies) {
    const record = { pkg: `${pkg.name} (node ${ourRange})`, dependency: name };
    const manifest = findDependencyManifest(pkgDir, name);

    if (!manifest) {
      results.push({
        ...record,
        status: 'skip',
        range: '—',
        detail: `${kind} is not installed`
      });
      continue;
    }

    let depRange;

    try {
      depRange = readJson(manifest).engines?.node;
    } catch (error) {
      results.push({
        ...record,
        status: 'fail',
        range: '—',
        detail: `unreadable ${kind} manifest: ${error.message}`
      });
      continue;
    }

    if (!depRange || !semver.validRange(depRange)) {
      results.push({
        ...record,
        status: 'skip',
        range: depRange ?? '—',
        detail: depRange ? `${kind} range is unparseable` : 'no engines.node'
      });
      continue;
    }

    const supported = semver.subset(ourRange, depRange);
    results.push({
      ...record,
      status: supported ? 'pass' : 'fail',
      range: depRange,
      detail: supported
        ? `${kind} supports the whole range`
        : `${kind} requires a newer Node`
    });
  }
}

const icons = { pass: '✔', fail: '✖', skip: '–' };

for (const result of results) {
  const line = `${icons[result.status]} ${cell(result.pkg)} → ${cell(result.dependency)} (node ${cell(result.range)}): ${cell(result.detail)}`;
  if (result.status === 'fail') {
    console.error(line);
  } else {
    console.log(line);
  }
}

const failures = results.filter(result => result.status === 'fail');
const skipped = results.filter(result => result.status === 'skip');

console.log(
  `\n${results.length - failures.length - skipped.length} passed, ${failures.length} failed, ${skipped.length} skipped`
);

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map(
    result =>
      `| ${icons[result.status]} | ${cell(result.pkg)} | ${cell(result.dependency)} | ${cell(result.range)} | ${cell(result.detail)} |`
  );
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '## Dependency engine audit',
      '',
      failures.length
        ? `**${failures.length} dependencies require a newer Node than the package that ships them.**`
        : 'All production and peer dependencies satisfy their package engines.',
      '',
      '| | Package | Dependency | Dependency engines.node | Detail |',
      '| --- | --- | --- | --- | --- |',
      ...rows,
      ''
    ].join('\n')
  );
}

if (failures.length) {
  process.exitCode = 1;
}
