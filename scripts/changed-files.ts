import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const GIT_CANDIDATES = ['/usr/bin/git', '/opt/homebrew/bin/git'] as const;

export type TRepositoryChanges = {
  readonly changedPaths: readonly string[];
  readonly presentFiles: readonly string[];
};

export const normalizePath = (filePath: string): string =>
  filePath.replaceAll('\\', '/').replace(/^\.\//u, '');

export const comparePaths = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

export const selectPresentChangedFiles = (
  changedPaths: readonly string[],
  presentFiles: readonly string[]
): readonly string[] => {
  const present = new Set(
    presentFiles.map((filePath) => normalizePath(filePath))
  );
  const selected: string[] = [];
  for (const changedPath of changedPaths) {
    const normalized = normalizePath(changedPath);
    if (present.has(normalized)) {
      selected.push(normalized);
    }
  }
  const unique = [...new Set(selected)];
  unique.sort(comparePaths);
  return unique;
};

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

export const readRepositoryChanges = (base: string): TRepositoryChanges => {
  const changedTracked = readGitLines(['diff', '--name-only', base]);
  const untracked = readGitLines([
    'ls-files',
    '--others',
    '--exclude-standard',
  ]);
  const trackedPresent = readGitLines(['ls-files']);
  return {
    changedPaths: [...changedTracked, ...untracked],
    presentFiles: [...trackedPresent, ...untracked],
  };
};
