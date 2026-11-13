import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { TPlannedMutant } from './mutation-types.js';

import { parsePlanPayload } from './mutation-parser.js';
import {
  DIFF_CACHE_FILE,
  INCREMENTAL_CACHE_FILE,
  type TMutationRunMode,
} from './mutation-runner-types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractMutantKey = (m: unknown): null | string => {
  if (!isRecord(m)) return null;
  const name = typeof m['mutatorName'] === 'string' ? m['mutatorName'] : '';
  const repl = typeof m['replacement'] === 'string' ? m['replacement'] : '';
  const loc =
    isRecord(m['location']) &&
    isRecord(m['location']['start']) &&
    isRecord(m['location']['end'])
      ? `${String(m['location']['start']['line'])}:${String(m['location']['start']['column'])}-${String(m['location']['end']['line'])}:${String(m['location']['end']['column'])}`
      : '';
  return name.length > 0 && loc.length > 0 ? `${name}@${loc}->${repl}` : null;
};

const parseFileMutantSet = (fileData: unknown): ReadonlySet<string> => {
  const set = new Set<string>();
  if (isRecord(fileData) && Array.isArray(fileData['mutants'])) {
    const mutantList: readonly unknown[] = fileData['mutants'];
    for (const m of mutantList) {
      const key = extractMutantKey(m);
      if (key !== null) {
        set.add(key);
      }
    }
  }
  return set;
};

export const readPackageVersion = (
  root: string,
  relative: string,
  fallback?: string
): string => {
  if (fallback !== undefined) return fallback;
  const full = path.resolve(root, relative);
  if (!fs.existsSync(full)) {
    console.error(`Package file not found in target root: ${relative}`);
    process.exit(1);
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(full, 'utf8'));
  const version =
    isRecord(parsed) && typeof parsed['version'] === 'string'
      ? parsed['version'].trim()
      : '';
  if (version.length === 0) {
    console.error(`Invalid version in package file: ${relative}`);
    process.exit(1);
  }
  return version;
};

export const readResolvedVersions = (
  root: string,
  testVersions?: {
    readonly node: string;
    readonly strykerCore: string;
    readonly strykerRunner: string;
    readonly vitest: string;
  }
): {
  readonly node: string;
  readonly strykerCore: string;
  readonly strykerRunner: string;
  readonly vitest: string;
} => ({
  node: testVersions?.node ?? process.version,
  strykerCore: readPackageVersion(
    root,
    'node_modules/@stryker-mutator/core/package.json',
    testVersions?.strykerCore
  ),
  strykerRunner: readPackageVersion(
    root,
    'node_modules/@stryker-mutator/vitest-runner/package.json',
    testVersions?.strykerRunner
  ),
  vitest: readPackageVersion(
    root,
    'node_modules/vitest/package.json',
    testVersions?.vitest
  ),
});

export const readHistoricalMutantsFromCache = (
  root: string,
  mode: TMutationRunMode
): {
  readonly error?: string;
  readonly initialCacheHash: null | string;
  readonly mutantsByFile: ReadonlyMap<string, ReadonlySet<string>>;
} => {
  const cacheRelative =
    mode === 'diff' ? DIFF_CACHE_FILE : INCREMENTAL_CACHE_FILE;
  const cachePath = path.resolve(root, cacheRelative);
  if (!fs.existsSync(cachePath)) {
    return { initialCacheHash: null, mutantsByFile: new Map() };
  }
  let raw: string;
  try {
    raw = fs.readFileSync(cachePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'read failed';
    return {
      error: `Failed to read initial cache file at "${cacheRelative}": ${message}`,
      initialCacheHash: null,
      mutantsByFile: new Map(),
    };
  }
  const initialCacheHash = crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');

  if (mode !== 'diff') {
    return { initialCacheHash, mutantsByFile: new Map() };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid json';
    return {
      error: `Failed to parse initial cache file at "${cacheRelative}": ${message}`,
      initialCacheHash,
      mutantsByFile: new Map(),
    };
  }

  const files = isRecord(parsed) ? parsed['files'] : null;
  const mutantsByFile = new Map<string, ReadonlySet<string>>();
  if (isRecord(files)) {
    for (const [filePath, fileData] of Object.entries(files)) {
      mutantsByFile.set(filePath, parseFileMutantSet(fileData));
    }
  }
  return { initialCacheHash, mutantsByFile };
};

export const readExpectedSources = (
  root: string,
  targets: readonly string[]
): ReadonlyMap<string, string> => {
  const map = new Map<string, string>();
  for (const t of targets) {
    const full = path.resolve(root, t);
    if (fs.existsSync(full)) {
      map.set(t, fs.readFileSync(full, 'utf8'));
    }
  }
  return map;
};

const backupDirectory = (source: string, destination: string): void => {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source)) {
    fs.copyFileSync(path.join(source, entry), path.join(destination, entry));
  }
  fs.rmSync(source, { force: true, recursive: true });
};

export const isolatePriorArtifacts = (
  root: string,
  reportPath: string
): void => {
  const eventsDirectory = path.resolve(root, 'reports/mutation/events');
  const manifestFile = path.resolve(root, 'reports/mutation/run-manifest.json');
  const hasReport = fs.existsSync(reportPath);
  const hasEvents =
    fs.existsSync(eventsDirectory) &&
    fs.readdirSync(eventsDirectory).length > 0;
  const hasManifest = fs.existsSync(manifestFile);

  if (!hasReport && !hasEvents && !hasManifest) {
    return;
  }

  const backupId = `archived-${String(Date.now())}-${crypto.randomBytes(3).toString('hex')}`;
  const backupDirectoryPath = path.resolve(
    root,
    'reports/mutation/runs',
    backupId
  );
  fs.mkdirSync(backupDirectoryPath, { recursive: true });
  if (hasReport) {
    fs.copyFileSync(
      reportPath,
      path.join(backupDirectoryPath, 'mutation.json')
    );
    fs.rmSync(reportPath, { force: true });
  }
  if (hasManifest) {
    fs.copyFileSync(
      manifestFile,
      path.join(backupDirectoryPath, 'run-manifest.json')
    );
    fs.rmSync(manifestFile, { force: true });
  }
  if (hasEvents) {
    backupDirectory(eventsDirectory, path.join(backupDirectoryPath, 'events'));
  }
};

export const readIndependentPlan = (
  eventsDirectory: string,
  root: string
): {
  error?: string;
  plan?: Map<string, TPlannedMutant[]>;
  rawPlanJson?: string;
} => {
  if (!fs.existsSync(eventsDirectory)) {
    return {
      error: 'Missing independent mutation testing plan events directory',
    };
  }
  const planFiles = fs
    .readdirSync(eventsDirectory)
    .filter((file) => file.includes('onMutationTestingPlanReady'));
  const firstPlan = planFiles[0];
  if (firstPlan === undefined) {
    return {
      error: 'No mutation testing plan event file found in events directory',
    };
  }
  const firstContent = fs.readFileSync(
    path.join(eventsDirectory, firstPlan),
    'utf8'
  );
  if (planFiles.length > 1) {
    const isConsistent = planFiles
      .slice(1)
      .every(
        (file) =>
          fs.readFileSync(path.join(eventsDirectory, file), 'utf8') ===
          firstContent
      );
    if (!isConsistent) {
      return {
        error: 'Multiple inconsistent mutation testing plan event files found',
      };
    }
  }
  const parsed = parsePlanPayload(firstContent, root);
  return parsed.error !== undefined || parsed.plan === undefined
    ? { error: parsed.error ?? 'Failed to parse plan payload' }
    : { plan: parsed.plan, rawPlanJson: firstContent };
};
