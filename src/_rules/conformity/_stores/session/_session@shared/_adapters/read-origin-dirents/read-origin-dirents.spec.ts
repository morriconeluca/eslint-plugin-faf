import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { readOriginDirents } from './index.js';

describe('readOriginDirents', () => {
  it('reads dirents recursively from an existing directory', async () => {
    const fixture = await createFixture({
      'nested/child.ts': 'export const child = 1;\n',
      'root.ts': 'export const root = 1;\n',
    });

    try {
      const dirents = readOriginDirents(fixture.path);
      const names = dirents.map((dirent) => dirent.name);
      expect(names).toContain('child.ts');
      expect(names).toContain('nested');
      expect(names).toContain('root.ts');
    } finally {
      await fixture.rm();
    }
  });

  it('returns an empty array when the origin does not exist', () => {
    const missing = nodePath.resolve('/path/does/not/exist/at/all');
    expect(readOriginDirents(missing)).toEqual([]);
  });
});
