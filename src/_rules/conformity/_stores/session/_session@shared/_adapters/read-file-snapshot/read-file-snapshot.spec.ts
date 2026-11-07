import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { readFileSnapshot } from './read-file-snapshot.adapter.js';

describe('readFileSnapshot', () => {
  it('returns mtime, size, and text for a regular file', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default { faf: { locals: [] } };',
    });

    try {
      const filePath = nodePath.join(fixture.path, 'fafconfig.ts');
      const snapshot = readFileSnapshot(filePath);
      expect(snapshot.present).toBe(true);
      if (snapshot.present) {
        expect(snapshot.text).toBe('export default { faf: { locals: [] } };');
        expect(snapshot.size).toBeGreaterThan(0);
        expect(snapshot.mtimeMs).toBeGreaterThan(0);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns absent when the path is missing or not a file', async () => {
    const fixture = await createFixture({
      nested: {},
    });

    try {
      expect(
        readFileSnapshot(nodePath.join(fixture.path, 'missing.ts')).present
      ).toBe(false);
      expect(
        readFileSnapshot(nodePath.join(fixture.path, 'nested')).present
      ).toBe(false);
      expect(readFileSnapshot('bad\0path').present).toBe(false);
    } finally {
      await fixture.rm();
    }
  });
});
