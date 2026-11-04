import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { readFileFingerprints } from './index.js';

describe('readFileFingerprints', () => {
  it('records mtime and size, and a missing file as an absent fingerprint', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default {};\n',
    });

    try {
      const filePath = nodePath.join(fixture.path, 'fafconfig.ts');
      const missingPath = nodePath.join(fixture.path, 'missing.ts');
      const fingerprints = readFileFingerprints([filePath, missingPath]);
      expect(fingerprints.get(filePath)?.size).toBeGreaterThan(0);
      expect(fingerprints.get(missingPath)).toEqual({
        mtimeMs: -1,
        path: missingPath,
        size: -1,
      });
    } finally {
      await fixture.rm();
    }
  });
});
