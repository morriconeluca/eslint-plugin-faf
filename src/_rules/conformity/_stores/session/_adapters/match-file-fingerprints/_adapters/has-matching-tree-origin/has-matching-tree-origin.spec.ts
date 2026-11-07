import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { hasMatchingTreeOrigin } from './has-matching-tree-origin.adapter.js';

describe('hasMatchingTreeOrigin', () => {
  it('returns true when tree origin contents match disk state', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;\n',
    });

    try {
      const origin = nodePath.join(fixture.path, 'src');
      const originStat = nodeFs.statSync(origin);
      const child = nodePath.join(origin, 'a.ts');
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
          origin,
          {
            mtimeMs: originStat.mtimeMs,
            path: origin,
            size: originStat.size,
          },
        ],
      ]);

      expect(hasMatchingTreeOrigin(expected, origin)).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('returns false when a file is added or removed from the origin', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;\n',
    });

    try {
      const origin = nodePath.join(fixture.path, 'src');
      const originStat = nodeFs.statSync(origin);
      const child = nodePath.join(origin, 'a.ts');
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
          origin,
          {
            mtimeMs: originStat.mtimeMs,
            path: origin,
            size: originStat.size,
          },
        ],
      ]);

      nodeFs.writeFileSync(
        nodePath.join(origin, 'b.ts'),
        'export const b = 2;\n'
      );
      expect(hasMatchingTreeOrigin(expected, origin)).toBe(false);

      nodeFs.rmSync(nodePath.join(origin, 'b.ts'));
      nodeFs.rmSync(child);
      expect(hasMatchingTreeOrigin(expected, origin)).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('returns false when tree origin stat is modified or missing', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;\n',
    });

    try {
      const origin = nodePath.join(fixture.path, 'src');
      const originStat = nodeFs.statSync(origin);
      const child = nodePath.join(origin, 'a.ts');
      const childStat = nodeFs.statSync(child);
      const modifiedSize = new Map([
        [
          child,
          {
            mtimeMs: childStat.mtimeMs,
            path: child,
            size: childStat.size,
          },
        ],
        [
          origin,
          {
            mtimeMs: originStat.mtimeMs,
            path: origin,
            size: originStat.size + 1,
          },
        ],
      ]);
      expect(hasMatchingTreeOrigin(modifiedSize, origin)).toBe(false);

      const modifiedMtime = new Map([
        [
          child,
          {
            mtimeMs: childStat.mtimeMs,
            path: child,
            size: childStat.size,
          },
        ],
        [
          origin,
          {
            mtimeMs: originStat.mtimeMs + 5000,
            path: origin,
            size: originStat.size,
          },
        ],
      ]);
      expect(hasMatchingTreeOrigin(modifiedMtime, origin)).toBe(false);

      const missing = nodePath.join(fixture.path, 'missing');
      expect(hasMatchingTreeOrigin(modifiedMtime, missing)).toBe(false);
      expect(
        hasMatchingTreeOrigin(
          new Map([[missing, { mtimeMs: 1234, path: missing, size: 50 }]]),
          missing
        )
      ).toBe(false);
      expect(
        hasMatchingTreeOrigin(
          new Map([[missing, { mtimeMs: -1, path: missing, size: -1 }]]),
          missing
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });
});
