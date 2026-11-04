import { createFixture } from 'fs-fixture';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { processDirent } from './index.js';

describe('processDirent', () => {
  it('processes a regular file dirent', async () => {
    const fixture = await createFixture({
      'file.ts': 'export const a = 1;',
    });
    try {
      const directoryEntries = fs.readdirSync(fixture.path, {
        withFileTypes: true,
      });
      const dirent = directoryEntries[0];
      if (dirent === undefined) {
        return;
      }

      const result = processDirent(dirent, fixture.path, fixture.path);

      expect(result.outcome).toBeUndefined();
      expect(result.entry).toEqual({
        isSymlink: false,
        kind: 'file',
        path: 'file.ts',
        realPath: 'file.ts',
      });
      expect(result.directoryToVisit).toBeUndefined();
    } finally {
      await fixture.rm();
    }
  });

  it('processes a directory dirent and returns directoryToVisit', async () => {
    const fixture = await createFixture({
      'sub/file.ts': 'export const a = 1;',
    });
    try {
      const directoryEntries = fs.readdirSync(fixture.path, {
        withFileTypes: true,
      });
      const dirent = directoryEntries[0];
      if (dirent === undefined) {
        return;
      }

      const result = processDirent(dirent, fixture.path, fixture.path);

      expect(result.outcome).toBeUndefined();
      expect(result.entry).toEqual({
        isSymlink: false,
        kind: 'directory',
        path: 'sub',
        realPath: 'sub',
      });
      expect(result.directoryToVisit).toBe(path.join(fixture.path, 'sub'));
    } finally {
      await fixture.rm();
    }
  });

  it('processes a directory symlink dirent without returning directoryToVisit', async () => {
    const fixture = await createFixture({
      'target-dir/file.ts': 'export const a = 1;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'target-dir'),
        path.join(fixture.path, 'link-dir'),
        'dir'
      );
      const directoryEntries = fs.readdirSync(fixture.path, {
        withFileTypes: true,
      });
      const dirent = directoryEntries.find((d) => d.name === 'link-dir');
      if (dirent === undefined) {
        return;
      }

      const result = processDirent(dirent, fixture.path, fixture.path);

      expect(result.outcome).toBeUndefined();
      expect(result.entry).toEqual({
        isSymlink: true,
        kind: 'directory',
        path: 'link-dir',
        realPath: 'target-dir',
      });
      expect(result.directoryToVisit).toBeUndefined();
    } finally {
      await fixture.rm();
    }
  });

  it('processes a file symlink dirent as kind file', async () => {
    const fixture = await createFixture({
      'target-file.ts': 'export const a = 1;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'target-file.ts'),
        path.join(fixture.path, 'link-file.ts'),
        'file'
      );
      const directoryEntries = fs.readdirSync(fixture.path, {
        withFileTypes: true,
      });
      const dirent = directoryEntries.find((d) => d.name === 'link-file.ts');
      expect(dirent).toBeDefined();
      if (dirent === undefined) {
        return;
      }

      const result = processDirent(dirent, fixture.path, fixture.path);

      expect(result.outcome).toBeUndefined();
      expect(result.entry).toEqual({
        isSymlink: true,
        kind: 'file',
        path: 'link-file.ts',
        realPath: 'target-file.ts',
      });
      expect(result.directoryToVisit).toBeUndefined();
    } finally {
      await fixture.rm();
    }
  });

  it('produces unverified outcome when symlink is broken', async () => {
    const fixture = await createFixture({});
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'missing.ts'),
        path.join(fixture.path, 'broken-link.ts'),
        'file'
      );
      const directoryEntries = fs.readdirSync(fixture.path, {
        withFileTypes: true,
      });
      const dirent = directoryEntries[0];
      if (dirent === undefined) {
        return;
      }

      const result = processDirent(dirent, fixture.path, fixture.path);

      expect(result.entry).toBeUndefined();
      expect(result.directoryToVisit).toBeUndefined();
      expect(result.outcome?.family).toBe('unverified');
      expect(result.outcome?.constraint).toBe('unverified/unreadable-entry');
      expect(result.outcome?.element).toBe('broken-link.ts');
    } finally {
      await fixture.rm();
    }
  });
});
