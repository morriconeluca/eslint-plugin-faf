import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { comparePaths } from './changed-files.js';
import { readResolvedVersions } from './mutation-artifacts.js';
import {
  DIFF_INC_FILE,
  INC_FILE,
  type TMutationRunManifest,
  type TMutationRunMode,
  type TMutationRunOptions,
  type TPreSpawnContext,
  type TSpawnResult,
} from './mutation-runner-types.js';

const STRYKER_BIN = './node_modules/.bin/stryker';
const GIT = ['/usr/bin/git', '/opt/homebrew/bin/git'] as const;
const IGNORED = new Set([
  '.cache',
  '.git',
  '.stryker-tmp',
  'coverage',
  'dist',
  'node_modules',
  'reports',
]);
const CONFIGS = [
  'stryker.config.json',
  'package.json',
  'tsconfig.json',
  'vitest.config.ts',
  'fafconfig.ts',
  'eslint.config.ts',
] as const;
const EXTENSIONS = ['.cjs', '.js', '.json', '.mjs', '.ts'] as const;

export const COMMANDS: Record<TMutationRunMode, string> = {
  diff: 'npm run gate:4:diff',
  force: 'npm run gate:4:force',
  incremental: 'npm run gate:4:incremental',
};

const resolveGit = (): string => GIT.find((c) => fs.existsSync(c)) ?? 'git';

const readGitInfo = (
  root: string,
  isTest = false
): { commit: string; isDirty: boolean } => {
  const git = resolveGit();
  const repository = spawnSync(git, ['rev-parse', '--is-inside-work-tree'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (repository.status !== 0) {
    if (isTest) return { commit: 'test-fixture', isDirty: false };
    console.error(`Target directory is not a git worktree: ${root}`);
    process.exit(1);
  }
  const sha = spawnSync(git, ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  const status = spawnSync(git, ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (sha.status !== 0 || status.status !== 0) {
    console.error(`Failed to read git info in ${root}`);
    process.exit(1);
  }
  return {
    commit: sha.stdout.trim(),
    isDirty: status.stdout.trim().length > 0,
  };
};

const hashFile = (filePath: string): string =>
  crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

const scanFiles = (
  directory: string,
  root: string,
  collected: Set<string>
): void => {
  if (!fs.existsSync(directory)) return;
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED.has(entry.name)) scanFiles(full, root, collected);
    } else {
      if (EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
        collected.add(path.relative(root, full).replaceAll('\\', '/'));
      }
    }
  }
};

const collectPertinentPaths = (
  root: string,
  targets: readonly string[]
): Set<string> => {
  const fileSet = new Set<string>(targets);
  for (const config of CONFIGS) {
    if (fs.existsSync(path.resolve(root, config))) fileSet.add(config);
  }
  for (const sourceDirectory of ['src', 'test', 'scripts']) {
    scanFiles(path.join(root, sourceDirectory), root, fileSet);
  }
  return fileSet;
};

export const snapshotInputs = (
  root: string,
  targets: readonly string[]
): {
  readonly fileHashes: ReadonlyMap<string, string>;
  readonly fingerprint: string;
} => {
  const sorted = [...collectPertinentPaths(root, targets)];
  sorted.sort(comparePaths);
  const fileHashes = new Map<string, string>();
  const digest = crypto.createHash('sha256');
  for (const file of sorted) {
    const hash = hashFile(path.resolve(root, file));
    fileHashes.set(file, hash);
    digest.update(`${file}:${hash};`);
  }
  return { fileHashes, fingerprint: digest.digest('hex') };
};

export const checkUnmodified = (
  root: string,
  snapshot: { readonly fileHashes: ReadonlyMap<string, string> },
  targets: readonly string[]
): null | string => {
  for (const [file, initialHash] of snapshot.fileHashes) {
    const full = path.resolve(root, file);
    if (!fs.existsSync(full)) {
      return `Pertinent file removed during mutation run: ${file}`;
    }
    try {
      if (hashFile(full) !== initialHash) {
        return `Pertinent file modified during mutation run: ${file}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'read failed';
      return `Pertinent file read error during verification: ${file} (${message})`;
    }
  }
  for (const file of collectPertinentPaths(root, targets)) {
    if (!snapshot.fileHashes.has(file)) {
      return `Pertinent file added during mutation run: ${file}`;
    }
  }
  return null;
};

export const collectPreSpawnContext = (
  root: string,
  options: TMutationRunOptions,
  targets: readonly string[],
  argv: readonly string[],
  runId: string,
  initialCacheHash: null | string
): TPreSpawnContext => {
  const gitInfo = readGitInfo(root, options.isTestContext ?? false);
  return {
    argv,
    gitCommit: gitInfo.commit,
    initialCacheHash,
    isDirty: gitInfo.isDirty,
    options,
    resolvedVersions: readResolvedVersions(root, options.testVersions),
    root,
    runId,
    snapshot: snapshotInputs(root, targets),
    startTime: new Date(),
    targets,
  };
};

export const buildManifest = (
  pre: TPreSpawnContext,
  spawnResult: TSpawnResult,
  endTime: Date
): TMutationRunManifest => ({
  argv: pre.argv,
  base: pre.options.base,
  command: pre.options.commandOverride ?? COMMANDS[pre.options.mode],
  cwd: pre.root,
  durationMs: endTime.getTime() - pre.startTime.getTime(),
  endTime: endTime.toISOString(),
  executable: STRYKER_BIN,
  exitCode: spawnResult.status ?? 1,
  fingerprint: pre.snapshot.fingerprint,
  gitCommit: pre.gitCommit,
  initialCacheHash: pre.initialCacheHash,
  isDirty: pre.isDirty,
  isPassed: false,
  mode: pre.options.mode,
  processOutcome: {
    exitCode: spawnResult.status,
    signal: spawnResult.signal === undefined ? null : spawnResult.signal,
  },
  reportPath: path.resolve(
    pre.root,
    pre.options.reportPath ?? 'reports/mutation/mutation.json'
  ),
  resolvedVersions: pre.resolvedVersions,
  reuseState: {
    force: pre.options.mode !== 'incremental',
    incrementalFile: pre.options.mode === 'diff' ? DIFF_INC_FILE : INC_FILE,
    reusedMutantResults:
      pre.options.mode === 'incremental' ? 'not-determined' : 0,
  },
  runId: pre.runId,
  startTime: pre.startTime.toISOString(),
  targets: pre.targets,
});

export const writeManifest = (
  manifestPath: string,
  manifest: TMutationRunManifest
): void => {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
};

const archiveTextArtifact = (
  content: string | undefined,
  destination: string
): undefined | { path: string; sha256: string } => {
  if (content === undefined) {
    return undefined;
  }
  fs.writeFileSync(destination, content, 'utf8');
  return {
    path: destination,
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
  };
};

export const archiveRunArtifacts = (
  runDirectory: string,
  base: TMutationRunManifest,
  manifestPath: string,
  reportPath: string,
  rawPlan?: string
): TMutationRunManifest => {
  fs.mkdirSync(runDirectory, { recursive: true });
  const reportContent = fs.existsSync(reportPath)
    ? fs.readFileSync(reportPath, 'utf8')
    : undefined;
  const report = archiveTextArtifact(
    reportContent,
    path.join(runDirectory, 'mutation.json')
  );
  const plan = archiveTextArtifact(
    rawPlan,
    path.join(runDirectory, 'plan.json')
  );
  const manifest: TMutationRunManifest = {
    ...base,
    artifacts: {
      ...(plan !== undefined && { plan }),
      ...(report !== undefined && { report }),
      runDirectory,
    },
  };
  writeManifest(manifestPath, manifest);
  writeManifest(path.join(runDirectory, 'run-manifest.json'), manifest);
  return manifest;
};
