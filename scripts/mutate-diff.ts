import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_EXTENSION = '.ts';
const EXCLUDED_SUFFIXES = ['.mock.ts', '.spec.ts', '.type.ts'] as const;

const normalizePath = (filePath: string): string =>
  filePath.replaceAll('\\', '/').replace(/^\.\//u, '');

const directoryOf = (filePath: string): string => {
  const normalized = normalizePath(filePath);
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
};

const isUnderSrc = (filePath: string): boolean => {
  const normalized = normalizePath(filePath);
  return normalized === 'src' || normalized.startsWith('src/');
};

const isExcludedSource = (filePath: string): boolean => {
  const normalized = normalizePath(filePath);
  const baseName = normalized.slice(normalized.lastIndexOf('/') + 1);
  const isIndex = baseName === 'index.ts';
  const hasExcludedSuffix = EXCLUDED_SUFFIXES.some((suffix) =>
    normalized.endsWith(suffix)
  );
  return isIndex || hasExcludedSuffix;
};

const isMutableSource = (filePath: string): boolean => {
  const normalized = normalizePath(filePath);
  return (
    normalized.endsWith(SOURCE_EXTENSION) &&
    isUnderSrc(normalized) &&
    !isExcludedSource(normalized)
  );
};

const comparePaths = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

export const selectMutationTargets = (
  changedPaths: readonly string[],
  presentFiles: readonly string[]
): readonly string[] => {
  const present = new Set(
    presentFiles.map((filePath) => normalizePath(filePath))
  );
  const touchedDirectories = new Set<string>();

  for (const changedPath of changedPaths) {
    const normalized = normalizePath(changedPath);
    if (isUnderSrc(normalized) && present.has(normalized)) {
      touchedDirectories.add(directoryOf(normalized));
    }
  }

  const targets: string[] = [];
  for (const filePath of present) {
    if (
      touchedDirectories.has(directoryOf(filePath)) &&
      isMutableSource(filePath)
    ) {
      targets.push(filePath);
    }
  }

  const uniqueTargets = [...new Set(targets)];
  uniqueTargets.sort(comparePaths);
  return uniqueTargets;
};

const INCREMENTAL_FILE = '.cache/stryker/diff.json';
const STRYKER_BIN = './node_modules/.bin/stryker';
const THRESHOLD_SCRIPT = 'scripts/check-mutation-threshold.ts';
const GIT_CANDIDATES = ['/usr/bin/git', '/opt/homebrew/bin/git'] as const;

const resolveGit = (): string => {
  const found = GIT_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (found === undefined) {
    console.error('git executable was not found');
    process.exit(1);
  }
  return found;
};

const readGitLines = (gitArguments: readonly string[]): readonly string[] => {
  const result = spawnSync(resolveGit(), [...gitArguments], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const details = result.stderr.trim();
    console.error(details.length > 0 ? details : 'git command failed');
    process.exit(result.status ?? 1);
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const runChecked = (
  executable: string,
  executableArguments: readonly string[]
): void => {
  const result = spawnSync(executable, [...executableArguments], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const runMutation = (targets: readonly string[]): void => {
  fs.mkdirSync(path.dirname(INCREMENTAL_FILE), { recursive: true });
  runChecked(STRYKER_BIN, [
    'run',
    '--mutate',
    targets.join(','),
    '--incremental',
    '--force',
    '--incrementalFile',
    INCREMENTAL_FILE,
  ]);
  runChecked(process.execPath, [THRESHOLD_SCRIPT]);
};

const main = (): void => {
  const base = process.argv[2] ?? 'main';
  const changedTracked = readGitLines(['diff', '--name-only', base]);
  const untracked = readGitLines([
    'ls-files',
    '--others',
    '--exclude-standard',
  ]);
  const trackedPresent = readGitLines(['ls-files']);
  const changedPaths = [...changedTracked, ...untracked];
  const presentFiles = [...trackedPresent, ...untracked];
  const targets = selectMutationTargets(changedPaths, presentFiles);

  if (targets.length === 0) {
    console.log(
      'No source files to mutate for the current diff. Mutation diff gate passed.'
    );
    return;
  }

  console.log(`Mutating ${String(targets.length)} file(s) against ${base}.`);
  runMutation(targets);
};

const isDirectExecution = (): boolean => {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
};

if (isDirectExecution()) {
  main();
}
