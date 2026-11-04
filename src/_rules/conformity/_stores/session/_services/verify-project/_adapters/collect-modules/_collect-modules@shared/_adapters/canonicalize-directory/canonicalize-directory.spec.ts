import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { canonicalizeDirectory } from './index.js';

describe('canonicalizeDirectory', () => {
  it('returns the real path of an existing directory', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
    });
    try {
      expect(canonicalizeDirectory(fixture.path)).toBe(
        nodeFs.realpathSync(fixture.path)
      );
    } finally {
      await fixture.rm();
    }
  });

  it('resolves a relative directory to its absolute real path', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
    });
    try {
      const relative = nodePath.relative(process.cwd(), fixture.path);
      expect(canonicalizeDirectory(relative)).toBe(
        nodeFs.realpathSync(fixture.path)
      );
    } finally {
      await fixture.rm();
    }
  });

  it('resolves a symlink base to its physical directory', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
    });
    const linked = await createFixture(async (target) => {
      await nodeFs.promises.symlink(
        fixture.path,
        nodePath.join(target.path, 'link')
      );
    });
    try {
      expect(canonicalizeDirectory(nodePath.join(linked.path, 'link'))).toBe(
        nodeFs.realpathSync(fixture.path)
      );
    } finally {
      await linked.rm();
      await fixture.rm();
    }
  });

  it('returns the resolved path when the directory does not exist', () => {
    const missing = nodePath.join(nodePath.resolve('/tmp'), 'faf-missing-base');
    expect(canonicalizeDirectory(missing)).toBe(missing);
    expect(canonicalizeDirectory('faf-missing-relative-base')).toBe(
      nodePath.resolve('faf-missing-relative-base')
    );
  });
});
