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
      const fingerprints = readFileFingerprints({
        watchedFiles: [filePath, missingPath],
      });
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

  it('records tree origin directory and all contained files recursively', async () => {
    const fixture = await createFixture({
      'src/_utils/widget/index.ts': 'export const widget = 1;\n',
    });

    try {
      const srcDirectory = nodePath.join(fixture.path, 'src');
      const childFile = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const fingerprints = readFileFingerprints({
        treeOrigins: [srcDirectory],
      });
      expect(fingerprints.get(srcDirectory)?.mtimeMs).toBeGreaterThan(0);
      expect(fingerprints.get(childFile)?.size).toBeGreaterThan(0);
    } finally {
      await fixture.rm();
    }
  });

  it('records an absent fingerprint when a tree origin does not exist', () => {
    const missingDirectory = nodePath.resolve('/path/does/not/exist/origin');
    const fingerprints = readFileFingerprints({
      treeOrigins: [missingDirectory],
    });
    expect(fingerprints.get(missingDirectory)).toEqual({
      mtimeMs: -1,
      path: missingDirectory,
      size: -1,
    });
  });

  it('skips unreadable dirents inside a tree origin', async () => {
    const fixture = await createFixture({
      'src/real.ts': 'export const real = 1;\n',
    });

    try {
      const srcDirectory = nodePath.join(fixture.path, 'src');
      const brokenLink = nodePath.join(srcDirectory, 'broken-link.ts');
      const realPath = nodePath.join(srcDirectory, 'real.ts');
      const nodeFs = await import('node:fs');
      nodeFs.symlinkSync('missing-target.ts', brokenLink);

      const fingerprints = readFileFingerprints({
        treeOrigins: [srcDirectory],
      });
      expect(fingerprints.get(realPath)?.size).toBeGreaterThan(0);
      expect(fingerprints.has(brokenLink)).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('returns an empty map when input has no watched files or tree origins', () => {
    const fingerprints = readFileFingerprints({});
    expect(fingerprints.size).toBe(0);
  });
});
