import nodePath from 'node:path';

import type { TFileFingerprint } from '../../../../../../_session@shared/_types/file-fingerprint.type.js';

export function countOriginExpectedEntries(
  expected: ReadonlyMap<string, TFileFingerprint>,
  origin: string
): number {
  const prefix = origin.endsWith(nodePath.sep)
    ? origin
    : `${origin}${nodePath.sep}`;
  let count = 0;
  for (const key of expected.keys()) {
    if (key.startsWith(prefix)) {
      count += 1;
    }
  }
  return count;
}
