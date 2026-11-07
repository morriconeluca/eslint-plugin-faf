import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { hasMatchingOriginDirents } from './has-matching-origin-dirents.adapter.js';

describe('hasMatchingOriginDirents', () => {
  it('returns true when all dirents match expected fingerprints', async () => {
    const fixture = await createFixture({
      'nested/child.ts': 'export const child = 1;\n',
    });

    try {
      const dirents = nodeFs.readdirSync(fixture.path, {
        recursive: true,
        withFileTypes: true,
      });
      const expected = new Map(
        dirents.map((dirent) => {
          const fullPath = nodePath.join(dirent.parentPath, dirent.name);
          const stat = nodeFs.statSync(fullPath);
          return [
            fullPath,
            { mtimeMs: stat.mtimeMs, path: fullPath, size: stat.size },
          ];
        })
      );

      expect(hasMatchingOriginDirents(expected, dirents)).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('returns false when a dirent is not expected or stat differs', async () => {
    const fixture = await createFixture({
      'child.ts': 'export const child = 1;\n',
    });

    try {
      const dirents = nodeFs.readdirSync(fixture.path, {
        recursive: true,
        withFileTypes: true,
      });
      const child = nodePath.join(fixture.path, 'child.ts');
      const expected = new Map([
        [child, { mtimeMs: 1234, path: child, size: 999 }],
      ]);

      expect(hasMatchingOriginDirents(expected, dirents)).toBe(false);
      expect(hasMatchingOriginDirents(new Map(), dirents)).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('handles absent dirents when stat returns undefined', async () => {
    const fixture = await createFixture({
      'phantom.ts': 'export const phantom = 1;\n',
    });

    try {
      const dirents = nodeFs.readdirSync(fixture.path, {
        recursive: true,
        withFileTypes: true,
      });
      const phantomPath = nodePath.join(fixture.path, 'phantom.ts');
      nodeFs.rmSync(phantomPath);

      expect(
        hasMatchingOriginDirents(
          new Map([
            [phantomPath, { mtimeMs: -1, path: phantomPath, size: -1 }],
          ]),
          dirents
        )
      ).toBe(true);

      expect(
        hasMatchingOriginDirents(
          new Map([
            [phantomPath, { mtimeMs: 100, path: phantomPath, size: -1 }],
          ]),
          dirents
        )
      ).toBe(false);
    } finally {
      await fixture.rm();
    }
  });
});
