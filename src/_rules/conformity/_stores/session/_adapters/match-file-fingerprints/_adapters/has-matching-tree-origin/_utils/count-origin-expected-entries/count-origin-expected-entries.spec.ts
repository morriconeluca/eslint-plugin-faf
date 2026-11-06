import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TFileFingerprint } from '../../../../../../_session@shared/_types/file-fingerprint.type.js';

import { countOriginExpectedEntries } from './index.js';

describe('countOriginExpectedEntries', () => {
  it('counts expected fingerprints residing under the origin path prefix', () => {
    const origin = nodePath.resolve('/workspace/src');
    const childOne = nodePath.resolve('/workspace/src/a.ts');
    const childTwo = nodePath.resolve('/workspace/src/nested/b.ts');
    const outside = nodePath.resolve('/workspace/package.json');

    const expected = new Map<string, TFileFingerprint>([
      [childOne, { mtimeMs: 1, path: childOne, size: 1 }],
      [childTwo, { mtimeMs: 2, path: childTwo, size: 2 }],
      [origin, { mtimeMs: 0, path: origin, size: 0 }],
      [outside, { mtimeMs: 3, path: outside, size: 3 }],
    ]);

    expect(countOriginExpectedEntries(expected, origin)).toBe(2);
    expect(
      countOriginExpectedEntries(expected, `${origin}${nodePath.sep}`)
    ).toBe(2);
  });
});
