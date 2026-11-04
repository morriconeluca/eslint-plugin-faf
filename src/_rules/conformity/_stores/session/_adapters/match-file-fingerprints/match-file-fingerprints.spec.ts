import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { readFileSnapshot } from '../../_session@shared/_adapters/read-file-snapshot/index.js';
import { hasMatchingFileFingerprints } from './index.js';

describe('hasMatchingFileFingerprints', () => {
  it('matches the current disk snapshot and rejects a size change', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default {};\n',
    });

    try {
      const filePath = nodePath.join(fixture.path, 'fafconfig.ts');
      const snapshot = readFileSnapshot(filePath);
      expect(snapshot.present).toBe(true);
      if (!snapshot.present) {
        return;
      }
      const expected = new Map([
        [
          filePath,
          { mtimeMs: snapshot.mtimeMs, path: filePath, size: snapshot.size },
        ],
      ]);
      expect(hasMatchingFileFingerprints(expected, [filePath])).toBe(true);
      expect(
        hasMatchingFileFingerprints(
          new Map([
            [filePath, { mtimeMs: snapshot.mtimeMs, path: filePath, size: 0 }],
          ]),
          [filePath]
        )
      ).toBe(false);
      expect(
        hasMatchingFileFingerprints(expected, [
          filePath,
          nodePath.join(fixture.path, 'missing.ts'),
        ])
      ).toBe(false);
      const missingPath = nodePath.join(fixture.path, 'gone.ts');
      const otherPath = nodePath.join(fixture.path, 'other.ts');
      expect(
        hasMatchingFileFingerprints(
          new Map([
            [
              filePath,
              {
                mtimeMs: snapshot.mtimeMs,
                path: filePath,
                size: snapshot.size,
              },
            ],
            [missingPath, { mtimeMs: -1, path: missingPath, size: -1 }],
          ]),
          [filePath, otherPath]
        )
      ).toBe(false);
      expect(
        hasMatchingFileFingerprints(
          new Map([
            [missingPath, { mtimeMs: -1, path: missingPath, size: -1 }],
          ]),
          [missingPath]
        )
      ).toBe(true);
      const later = new Date(snapshot.mtimeMs + 5000);
      nodeFs.utimesSync(filePath, later, later);
      expect(hasMatchingFileFingerprints(expected, [filePath])).toBe(false);
    } finally {
      await fixture.rm();
    }
  });
});
