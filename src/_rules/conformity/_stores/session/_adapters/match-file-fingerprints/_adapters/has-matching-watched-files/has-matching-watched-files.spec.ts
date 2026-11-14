import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { hasMatchingWatchedFiles } from './has-matching-watched-files.adapter.js';

describe('hasMatchingWatchedFiles', () => {
  it('returns true when all watched files match disk state', async () => {
    const fixture = await createFixture({
      'faf.config.ts': 'export default {};\n',
    });

    try {
      const filePath = nodePath.join(fixture.path, 'faf.config.ts');
      const stat = nodeFs.statSync(filePath);
      const expected = new Map([
        [filePath, { mtimeMs: stat.mtimeMs, path: filePath, size: stat.size }],
      ]);
      expect(hasMatchingWatchedFiles(expected, [filePath])).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('returns false when a watched file is modified or absent', async () => {
    const fixture = await createFixture({
      'faf.config.ts': 'export default {};\n',
    });

    try {
      const filePath = nodePath.join(fixture.path, 'faf.config.ts');
      const missing = nodePath.join(fixture.path, 'missing.ts');
      const stat = nodeFs.statSync(filePath);
      const expected = new Map([
        [filePath, { mtimeMs: stat.mtimeMs, path: filePath, size: stat.size }],
        [missing, { mtimeMs: 1234, path: missing, size: 10 }],
      ]);
      expect(hasMatchingWatchedFiles(expected, [filePath, missing])).toBe(
        false
      );

      const modifiedExpected = new Map([
        [
          filePath,
          { mtimeMs: stat.mtimeMs, path: filePath, size: stat.size + 100 },
        ],
      ]);
      expect(hasMatchingWatchedFiles(modifiedExpected, [filePath])).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('matches absent files when expected mtime and size are -1', () => {
    const missing = nodePath.resolve('/path/to/missing.ts');
    const expected = new Map([
      [missing, { mtimeMs: -1, path: missing, size: -1 }],
    ]);
    expect(hasMatchingWatchedFiles(expected, [missing])).toBe(true);
  });
});
