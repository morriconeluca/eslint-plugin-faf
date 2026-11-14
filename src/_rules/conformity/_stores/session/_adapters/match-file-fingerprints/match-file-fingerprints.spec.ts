import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { hasMatchingFileFingerprints } from './match-file-fingerprints.adapter.js';

describe('hasMatchingFileFingerprints', () => {
  it('returns true when watched files and tree origins match expected fingerprints', async () => {
    const fixture = await createFixture({
      'faf.config.ts': 'export default {};\n',
      'src/a.ts': 'export const a = 1;\n',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const origin = nodePath.join(fixture.path, 'src');
      const child = nodePath.join(origin, 'a.ts');
      const configStat = nodeFs.statSync(configPath);
      const originStat = nodeFs.statSync(origin);
      const childStat = nodeFs.statSync(child);

      const expected = new Map([
        [
          child,
          {
            mtimeMs: childStat.mtimeMs,
            path: child,
            size: childStat.size,
          },
        ],
        [
          configPath,
          {
            mtimeMs: configStat.mtimeMs,
            path: configPath,
            size: configStat.size,
          },
        ],
        [
          origin,
          {
            mtimeMs: originStat.mtimeMs,
            path: origin,
            size: originStat.size,
          },
        ],
      ]);

      expect(
        hasMatchingFileFingerprints(expected, {
          treeOrigins: [origin],
          watchedFiles: [configPath],
        })
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('returns true when input has no watched files or tree origins', () => {
    expect(hasMatchingFileFingerprints(new Map(), {})).toBe(true);
  });

  it('returns false when watched files do not match', async () => {
    const fixture = await createFixture({
      'faf.config.ts': 'export default {};\n',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const expected = new Map([
        [configPath, { mtimeMs: 1234, path: configPath, size: 10 }],
      ]);

      expect(
        hasMatchingFileFingerprints(expected, {
          watchedFiles: [configPath],
        })
      ).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('returns false when a tree origin does not match', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;\n',
    });

    try {
      const origin = nodePath.join(fixture.path, 'src');
      const expected = new Map([
        [origin, { mtimeMs: 1234, path: origin, size: 10 }],
      ]);

      expect(
        hasMatchingFileFingerprints(expected, {
          treeOrigins: [origin],
        })
      ).toBe(false);
    } finally {
      await fixture.rm();
    }
  });
});
