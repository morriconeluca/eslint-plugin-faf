import { createFixture } from 'fs-fixture';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  comparePaths,
  normalizePath,
  readRepositoryChanges,
  selectPresentChangedFiles,
} from '../../scripts/changed-files.js';
import { resolveModifiedFiles } from '../../scripts/check.js';

const GIT_EXECUTABLE = '/usr/bin/git';

const runGit = (
  gitArguments: readonly string[],
  cwd = process.cwd()
): string => {
  const result = spawnSync(GIT_EXECUTABLE, [...gitArguments], {
    cwd,
    encoding: 'utf8',
  });
  expect(result.status).toBe(0);
  return result.stdout.trim();
};

const readGitLines = (gitArguments: readonly string[]): readonly string[] =>
  runGit(gitArguments)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

describe('selectPresentChangedFiles and path utilities', () => {
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

  it('normalizes paths and compares ordinally', () => {
    expect(normalizePath('.\\src\\foo\\bar.ts')).toBe('src/foo/bar.ts');
    expect(comparePaths('a', 'b')).toBe(-1);
    expect(comparePaths('b', 'a')).toBe(1);
    expect(comparePaths('a', 'a')).toBe(0);
  });
});

describe('resolveModifiedFiles', () => {
  it('matches the tracked diff and untracked files still present without mutating git', () => {
    const diff = readGitLines(['diff', '--name-only', 'HEAD']);
    const untracked = readGitLines([
      'ls-files',
      '--others',
      '--exclude-standard',
    ]);
    const present = new Set([...readGitLines(['ls-files']), ...untracked]);
    const expected = [...new Set([...diff, ...untracked])]
      .map((p) => p.replaceAll('\\', '/').replace(/^\.\//u, ''))
      .filter((p) => present.has(p));
    expected.sort(comparePaths);

    const stageBefore = readGitLines(['ls-files', '--stage']);
    expect(resolveModifiedFiles('HEAD')).toEqual(expected);
    expect(readGitLines(['ls-files', '--stage'])).toEqual(stageBefore);
  });
});

describe('readRepositoryChanges', () => {
  it('reads repository changes respecting custom cwd', async () => {
    const fixture = await createFixture({ 'existing.txt': 'initial' });
    try {
      runGit(['init', '-b', 'main'], fixture.path);
      runGit(['config', 'user.name', 'test'], fixture.path);
      runGit(['config', 'user.email', 'test@test.com'], fixture.path);
      runGit(['add', '.'], fixture.path);
      runGit(['commit', '-m', 'initial'], fixture.path);
      runGit(['checkout', '-b', 'feature'], fixture.path);
      fs.writeFileSync(path.join(fixture.path, 'existing.txt'), 'modified');
      fs.writeFileSync(path.join(fixture.path, 'untracked.txt'), 'new');

      const changes = readRepositoryChanges('main', fixture.path);
      expect(changes.changedPaths).toContain('existing.txt');
      expect(changes.changedPaths).toContain('untracked.txt');
    } finally {
      await fixture.rm();
    }
  });
});
