import { createFixture } from 'fs-fixture';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { scanTreeOrigin } from './index.js';

describe('scanTreeOrigin', () => {
  it('produces configuration outcome when origin directory does not exist', async () => {
    const fixture = await createFixture({});
    try {
      const { entries, outcomes } = scanTreeOrigin('missing-src', fixture.path);

      expect(entries).toEqual([]);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.family).toBe('configuration');
      expect(outcomes[0]?.constraint).toBe('configuration/missing-origin');
    } finally {
      await fixture.rm();
    }
  });

  it('produces configuration outcome when origin is a file instead of a directory', async () => {
    const fixture = await createFixture({
      'file-origin.ts': 'export const a = 1;',
    });
    try {
      const { entries, outcomes } = scanTreeOrigin(
        'file-origin.ts',
        fixture.path
      );

      expect(entries).toEqual([]);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.family).toBe('configuration');
      expect(outcomes[0]?.constraint).toBe('configuration/invalid-origin');
    } finally {
      await fixture.rm();
    }
  });

  it('normalizes origin with leading dot-slash and trailing slash', async () => {
    const fixture = await createFixture({
      'src/file.ts': 'export const a = 1;',
    });
    try {
      const { entries, outcomes } = scanTreeOrigin('./src/', fixture.path);

      expect(outcomes).toEqual([]);
      expect(entries[0]?.path).toBe('src');
    } finally {
      await fixture.rm();
    }
  });

  it('converts Windows backslashes in origin path to POSIX forward slashes', async () => {
    const fixture = await createFixture({
      'src/sub/file.ts': 'export const a = 1;',
    });
    try {
      const { entries, outcomes } = scanTreeOrigin('src\\sub', fixture.path);

      expect(outcomes).toEqual([]);
      expect(entries[0]?.path).toBe('src/sub');
    } finally {
      await fixture.rm();
    }
  });

  it('scans a directory tree sorting directory entries lexicographically', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;',
      'src/B.ts': 'export const B = 1;',
    });
    try {
      const { entries, outcomes } = scanTreeOrigin('src', fixture.path);

      expect(outcomes).toEqual([]);
      const paths = entries.map((entry) => entry.path);
      expect(paths).toEqual(['src', 'src/B.ts', 'src/a.ts']);
    } finally {
      await fixture.rm();
    }
  });

  it('orders directory entries by UTF-16 code units and repeats that order', async () => {
    const fixture = await createFixture({
      'src/@x.ts': 'export const at = 1;',
      'src/[id].ts': 'export const bracket = 1;',
      'src/_a.ts': 'export const underscore = 1;',
      'src/B.ts': 'export const upper = 1;',
      'src/c.ts': 'export const lower = 1;',
    });
    try {
      const first = scanTreeOrigin('src', fixture.path);
      const second = scanTreeOrigin('src', fixture.path);
      const expected = [
        'src',
        'src/@x.ts',
        'src/B.ts',
        'src/[id].ts',
        'src/_a.ts',
        'src/c.ts',
      ];

      expect(first.outcomes).toEqual([]);
      expect(first.entries.map((entry) => entry.path)).toEqual(expected);
      expect(second.entries.map((entry) => entry.path)).toEqual(expected);
    } finally {
      await fixture.rm();
    }
  });

  it('does not traverse into a directory symlink', async () => {
    const fixture = await createFixture({
      'external-target/nested.ts': 'export const nested = true;',
      'src/main.ts': 'export const main = 1;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'external-target'),
        path.join(fixture.path, 'src/linked-dir'),
        'dir'
      );

      const { entries, outcomes } = scanTreeOrigin('src', fixture.path);

      expect(outcomes).toEqual([]);
      const symlinkEntry = entries.find(
        (entry) => entry.path === 'src/linked-dir'
      );
      expect(symlinkEntry?.isSymlink).toBe(true);
      expect(symlinkEntry?.kind).toBe('directory');

      const paths = entries.map((entry) => entry.path);
      expect(paths).not.toContain('src/linked-dir/nested.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('records a file symlink with canonical realPath relative to base when internal', async () => {
    const fixture = await createFixture({
      'src/target.ts': 'export const target = true;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'src/target.ts'),
        path.join(fixture.path, 'src/link.ts'),
        'file'
      );

      const { entries, outcomes } = scanTreeOrigin('src', fixture.path);

      expect(outcomes).toEqual([]);
      const linkEntry = entries.find((entry) => entry.path === 'src/link.ts');
      expect(linkEntry?.isSymlink).toBe(true);
      expect(linkEntry?.kind).toBe('file');
      expect(linkEntry?.realPath).toBe('src/target.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('produces unverified outcome for broken symlinks inside tree', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const main = 1;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'nonexistent-target.ts'),
        path.join(fixture.path, 'src/broken-link.ts'),
        'file'
      );

      const { outcomes } = scanTreeOrigin('src', fixture.path);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.family).toBe('unverified');
      expect(outcomes[0]?.constraint).toBe('unverified/unreadable-entry');
      expect(outcomes[0]?.element).toBe('src/broken-link.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('does not traverse origin directory when the origin itself is a symlink', async () => {
    const fixture = await createFixture({
      'actual-src/index.ts': 'export const a = 1;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'actual-src'),
        path.join(fixture.path, 'src-link'),
        'dir'
      );

      const { entries, outcomes } = scanTreeOrigin('src-link', fixture.path);

      expect(outcomes).toEqual([]);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.path).toBe('src-link');
      expect(entries[0]?.isSymlink).toBe(true);
      expect(entries[0]?.kind).toBe('directory');
    } finally {
      await fixture.rm();
    }
  });

  it('produces unverified outcome when nested subdirectory cannot be read', async () => {
    const fixture = await createFixture({
      'src/locked/file.ts': 'export const a = 1;',
    });
    try {
      fs.chmodSync(path.join(fixture.path, 'src/locked'), 0);

      const { outcomes } = scanTreeOrigin('src', fixture.path);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.family).toBe('unverified');
      expect(outcomes[0]?.constraint).toBe('unverified/unreadable-entry');
      expect(outcomes[0]?.element).toBe('src/locked');
      expect(outcomes[0]?.normativeReference).toBe('D-06');
      expect(outcomes[0]?.message).toContain(
        "'src/locked' could not be inspected:"
      );
    } finally {
      fs.chmodSync(path.join(fixture.path, 'src/locked'), 0o700);
      await fixture.rm();
    }
  });
});
