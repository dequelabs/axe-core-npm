#!/usr/bin/env node
/**
 * Fails when a package's production or peer dependency declares an
 * `engines.node` range that our own `engines.node` is not fully contained by —
 * i.e. we advertise support for a Node version the dependency does not.
 * Also reports, without failing, the tightest floor each package's
 * dependencies actually justify.
 */
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Published packages only — a test workspace's engines.node is not a contract.
const packagesDir = join(repoRoot, 'packages');

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

const VALID_DEPENDENCY_NAME =
  /^(@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

/**
 * Walk up node_modules directories the way Node's resolver would, stopping at
 * the repo root so a stray node_modules above the checkout can't be audited.
 */
const findDependencyManifest = (fromDir, name) => {
  // A manifest is attacker-authored on a fork PR, so a dependency key could
  // otherwise traverse out of node_modules and read any package.json on disk.
  if (!VALID_DEPENDENCY_NAME.test(name)) {
    return null;
  }

  let dir = fromDir;
  while (true) {
    const manifest = join(dir, 'node_modules', name, 'package.json');
    if (existsSync(manifest) && resolve(manifest).startsWith(repoRoot + sep)) {
      return manifest;
    }
    const parent = dirname(dir);
    if (dir === repoRoot || parent === dir) {
      return null;
    }
    dir = parent;
  }
};

/**
 * Manifest values are third-party text; keep them to one readable line and
 * strip control characters so a hostile range can't spoof the log with ANSI.
 */
const clean = value =>
  String(value)
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .slice(0, 120);

/** Table cells additionally need `|` escaped so a range can't split the row. */
const cell = value => clean(value).replace(/\|/g, '\\|');

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

  // Tightest floor the dependencies actually justify, for drift in the
  // too-generous direction as well as the too-strict one.
  const floors = [];

  for (const [name, kind] of dependencies) {
    const record = { pkg: `${pkg.name} (node ${ourRange})`, dependency: name };
    const manifest = findDependencyManifest(pkgDir, name);

    if (!manifest) {
      results.push({
        ...record,
        status: 'fail',
        range: '—',
        detail: `${kind} could not be resolved, so its engines.node went unchecked`
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
        detail: depRange
          ? `${kind} range is unparseable`
          : `${kind} declares no engines.node`
      });
      continue;
    }

    const depFloor = semver.minVersion(depRange);
    if (depFloor) {
      floors.push(depFloor);
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

  const tightest = floors.sort(semver.rcompare)[0];
  results.push({
    status: 'info',
    pkg: `${pkg.name} (node ${ourRange})`,
    dependency: '—',
    range: tightest ? `>=${tightest.version}` : '—',
    detail: tightest
      ? `tightest floor the dependencies justify is >=${tightest.version}`
      : 'no dependency constrains the floor'
  });
}

const icons = { pass: '✔', fail: '✖', skip: '–', info: 'ℹ' };

for (const result of results) {
  const line = `${icons[result.status]} ${clean(result.pkg)} → ${clean(result.dependency)} (node ${clean(result.range)}): ${clean(result.detail)}`;
  if (result.status === 'fail') {
    console.error(line);
  } else {
    console.log(line);
  }
}

const count = status =>
  results.filter(result => result.status === status).length;
const failures = count('fail');

console.log(
  `\n${count('pass')} passed, ${failures} failed, ${count('skip')} skipped`
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
      failures
        ? `**${failures} checks failed.**`
        : 'All production and peer dependencies satisfy their package engines.',
      '',
      '| | Package | Dependency | Dependency engines.node | Detail |',
      '| --- | --- | --- | --- | --- |',
      ...rows,
      ''
    ].join('\n')
  );
}

if (failures) {
  process.exitCode = 1;
}
