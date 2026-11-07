import { createFixture } from 'fs-fixture';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { toPosixPath } from '../../../../../../_session@shared/_utils/to-posix-path/index.js';
import { listEntries } from './list-entries.adapter.js';

describe('listEntries', () => {
  it('returns empty value when origins list is empty', () => {
    const result = listEntries('/some/path', []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('scans real tree on disk returning raw inventory entries', async () => {
    const fixture = await createFixture({
      'src/components/button.tsx': 'export const Button = null;',
      'src/main.ts': "export const main = 'ok';",
    });

    try {
      const result = listEntries(fixture.path, ['src']);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const paths = result.value.map((entry) => entry.path);
      expect(paths).toContain('src');
      expect(paths).toContain('src/components');
      expect(paths).toContain('src/components/button.tsx');
      expect(paths).toContain('src/main.ts');

      const mainEntry = result.value.find(
        (entry) => entry.path === 'src/main.ts'
      );
      expect(mainEntry?.kind).toBe('file');
      expect(mainEntry?.isSymlink).toBe(false);
      expect(mainEntry?.realPath).toBe('src/main.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when origin directory does not exist', async () => {
    const fixture = await createFixture({});

    try {
      const result = listEntries(fixture.path, ['nonexistent-origin']);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }

      expect(result.outcomes).toHaveLength(1);
      const outcome = result.outcomes[0];
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.constraint).toBe('configuration/missing-origin');
      expect(outcome?.element).toBe('nonexistent-origin');
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when origin is a file rather than a directory', async () => {
    const fixture = await createFixture({
      'single-file.ts': 'export const x = 1;',
    });

    try {
      const result = listEntries(fixture.path, ['single-file.ts']);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }

      expect(result.outcomes).toHaveLength(1);
      const outcome = result.outcomes[0];
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.constraint).toBe('configuration/invalid-origin');
      expect(outcome?.element).toBe('single-file.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('does not traverse directory symlinks within a tree', async () => {
    const fixture = await createFixture({
      'external-dir/secret.ts': 'export const secret = 42;',
      'src/file.ts': 'export const file = 1;',
    });

    try {
      fs.symlinkSync(
        path.join(fixture.path, 'external-dir'),
        path.join(fixture.path, 'src/linked-folder'),
        'dir'
      );

      const result = listEntries(fixture.path, ['src']);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const symlinkEntry = result.value.find(
        (entry) => entry.path === 'src/linked-folder'
      );
      expect(symlinkEntry?.isSymlink).toBe(true);
      expect(symlinkEntry?.kind).toBe('directory');

      const paths = result.value.map((entry) => entry.path);
      expect(paths).not.toContain('src/linked-folder/secret.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('records file symlinks with canonical relative path when internal', async () => {
    const fixture = await createFixture({
      'src/actual.ts': 'export const actual = true;',
    });

    try {
      fs.symlinkSync(
        path.join(fixture.path, 'src/actual.ts'),
        path.join(fixture.path, 'src/symlink.ts'),
        'file'
      );

      const result = listEntries(fixture.path, ['src']);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const symlinkEntry = result.value.find(
        (entry) => entry.path === 'src/symlink.ts'
      );
      expect(symlinkEntry?.isSymlink).toBe(true);
      expect(symlinkEntry?.kind).toBe('file');
      expect(symlinkEntry?.realPath).toBe('src/actual.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('records file symlink to an external file outside base directory with canonical path', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const main = 1;',
    });
    const externalTemporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'faf-external-')
    );
    const externalFilePath = path.join(
      externalTemporaryDirectory,
      'external-target.ts'
    );
    fs.writeFileSync(externalFilePath, 'export const ext = 1;', 'utf8');

    try {
      fs.symlinkSync(
        externalFilePath,
        path.join(fixture.path, 'src/external-link.ts'),
        'file'
      );

      const result = listEntries(fixture.path, ['src']);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const symlinkEntry = result.value.find(
        (entry) => entry.path === 'src/external-link.ts'
      );
      expect(symlinkEntry?.isSymlink).toBe(true);
      expect(symlinkEntry?.kind).toBe('file');
      const canonicalExternal = toPosixPath(fs.realpathSync(externalFilePath));
      expect(symlinkEntry?.realPath).toBe(canonicalExternal);
    } finally {
      fs.rmSync(externalTemporaryDirectory, { force: true, recursive: true });
      await fixture.rm();
    }
  });

  it('returns unverified outcome when inspecting a broken symlink', async () => {
    const fixture = await createFixture({
      'src/file.ts': 'export const file = 1;',
    });

    try {
      fs.symlinkSync(
        path.join(fixture.path, 'nonexistent-target.ts'),
        path.join(fixture.path, 'src/broken.ts'),
        'file'
      );

      const result = listEntries(fixture.path, ['src']);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }

      expect(result.outcomes).toHaveLength(1);
      const outcome = result.outcomes[0];
      expect(outcome?.family).toBe('unverified');
      expect(outcome?.constraint).toBe('unverified/unreadable-entry');
      expect(outcome?.element).toBe('src/broken.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('scans multiple tree origins correctly', async () => {
    const fixture = await createFixture({
      'apps/app.ts': 'export const app = 1;',
      'libs/lib.ts': 'export const lib = 1;',
    });

    try {
      const result = listEntries(fixture.path, ['apps', 'libs']);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const paths = result.value.map((entry) => entry.path);
      expect(paths).toContain('apps');
      expect(paths).toContain('apps/app.ts');
      expect(paths).toContain('libs');
      expect(paths).toContain('libs/lib.ts');
    } finally {
      await fixture.rm();
    }
  });
});
