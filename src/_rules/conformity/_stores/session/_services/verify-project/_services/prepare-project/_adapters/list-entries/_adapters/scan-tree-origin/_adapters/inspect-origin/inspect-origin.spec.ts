import { createFixture } from 'fs-fixture';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { inspectOrigin } from './index.js';

describe('inspectOrigin', () => {
  it('returns configuration outcome when origin directory does not exist', async () => {
    const fixture = await createFixture({});
    try {
      const result = inspectOrigin(
        path.join(fixture.path, 'missing'),
        'missing',
        fixture.path
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcome).toEqual({
          constraint: 'configuration/missing-origin',
          element: 'missing',
          family: 'configuration',
          message: "Tree origin directory 'missing' does not exist.",
          normativeReference: '§6',
          propertyPath: 'faf.locals',
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when origin is a file', async () => {
    const fixture = await createFixture({
      'file.ts': 'export const a = 1;',
    });
    try {
      const result = inspectOrigin(
        path.join(fixture.path, 'file.ts'),
        'file.ts',
        fixture.path
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcome).toEqual({
          constraint: 'configuration/invalid-origin',
          element: 'file.ts',
          family: 'configuration',
          message: "Tree origin 'file.ts' must be a directory.",
          normativeReference: '§6',
          propertyPath: 'faf.locals',
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns ok with isSymlink false for a regular directory origin', async () => {
    const fixture = await createFixture({
      'src/file.ts': 'export const a = 1;',
    });
    try {
      const result = inspectOrigin(
        path.join(fixture.path, 'src'),
        'src',
        fixture.path
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.isSymlink).toBe(false);
        expect(result.originReal).toBe('src');
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns invalid-origin outcome when origin is a broken symlink', async () => {
    const fixture = await createFixture({});
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'nonexistent-target'),
        path.join(fixture.path, 'broken-origin'),
        'dir'
      );

      const result = inspectOrigin(
        path.join(fixture.path, 'broken-origin'),
        'broken-origin',
        fixture.path
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcome).toEqual({
          constraint: 'configuration/invalid-origin',
          element: 'broken-origin',
          family: 'configuration',
          message: "Tree origin 'broken-origin' must be a directory.",
          normativeReference: '§6',
          propertyPath: 'faf.locals',
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns ok with isSymlink true when origin is a valid directory symlink', async () => {
    const fixture = await createFixture({
      'real-target/file.ts': 'export const a = 1;',
    });
    try {
      fs.symlinkSync(
        path.join(fixture.path, 'real-target'),
        path.join(fixture.path, 'symlink-origin'),
        'dir'
      );

      const result = inspectOrigin(
        path.join(fixture.path, 'symlink-origin'),
        'symlink-origin',
        fixture.path
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.isSymlink).toBe(true);
        expect(result.originReal).toBe('real-target');
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns unverified outcome when origin directory access is forbidden by permission', async () => {
    const fixture = await createFixture({
      'locked/child/file.ts': 'export const a = 1;',
    });
    try {
      fs.chmodSync(path.join(fixture.path, 'locked'), 0);
      const result = inspectOrigin(
        path.join(fixture.path, 'locked/child'),
        'locked/child',
        fixture.path
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcome.family).toBe('unverified');
        expect(result.outcome.constraint).toBe('unverified/unreadable-origin');
        expect(result.outcome.normativeReference).toBe('§6');
        expect(result.outcome.message).toContain(
          "Tree origin directory 'locked/child' could not be read:"
        );
      }
    } finally {
      fs.chmodSync(path.join(fixture.path, 'locked'), 0o700);
      await fixture.rm();
    }
  });
});
