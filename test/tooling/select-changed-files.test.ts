import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import {
  comparePaths,
  selectPresentChangedFiles,
} from '../../scripts/changed-files.js';
import { resolveModifiedFiles } from '../../scripts/check.js';

const GIT_EXECUTABLE = '/usr/bin/git';

const readGitLines = (gitArguments: readonly string[]): readonly string[] => {
  const result = spawnSync(GIT_EXECUTABLE, [...gitArguments], {
    encoding: 'utf8',
  });
  expect(result.status).toBe(0);
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

describe('selectPresentChangedFiles', () => {
  it('keeps tracked and untracked paths that are still present', () => {
    expect(
      selectPresentChangedFiles(
        ['src/tracked.ts', 'src/new.ts', 'src/deleted.ts'],
        ['src/new.ts', 'src/tracked.ts', 'src/untouched.ts']
      )
    ).toEqual(['src/new.ts', 'src/tracked.ts']);
  });

  it('drops deleted paths that are no longer present', () => {
    expect(
      selectPresentChangedFiles(['src/deleted.ts'], ['src/kept.ts'])
    ).toEqual([]);
  });

  it('returns each present changed path once in code unit order', () => {
    expect(
      selectPresentChangedFiles(
        ['src/b.ts', 'src/a.ts', 'src/b.ts'],
        ['src/b.ts', 'src/a.ts']
      )
    ).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('normalizes dot-slash prefixes and backslashes before matching', () => {
    expect(
      selectPresentChangedFiles(
        ['./src/a.ts', 'src\\b.ts'],
        ['src/a.ts', 'src/b.ts']
      )
    ).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('ignores present files that did not change', () => {
    expect(selectPresentChangedFiles([], ['src/untouched.ts'])).toEqual([]);
  });
});

describe('resolveModifiedFiles', () => {
  it('matches the tracked diff and untracked files still present', () => {
    const diff = readGitLines(['diff', '--name-only', 'main']);
    const untracked = readGitLines([
      'ls-files',
      '--others',
      '--exclude-standard',
    ]);
    const present = new Set([...readGitLines(['ls-files']), ...untracked]);
    const expected = [...new Set([...diff, ...untracked])]
      .map((filePath) => filePath.replaceAll('\\', '/').replace(/^\.\//u, ''))
      .filter((filePath) => present.has(filePath));
    expected.sort(comparePaths);

    expect(resolveModifiedFiles('main')).toEqual(expected);
  });

  it('does not modify the git index or the worktree status', () => {
    const stageBefore = readGitLines(['ls-files', '--stage']);
    const statusBefore = readGitLines(['status', '--porcelain=v1']);

    resolveModifiedFiles('main');

    expect(readGitLines(['ls-files', '--stage'])).toEqual(stageBefore);
    expect(readGitLines(['status', '--porcelain=v1'])).toEqual(statusBefore);
  });
});
