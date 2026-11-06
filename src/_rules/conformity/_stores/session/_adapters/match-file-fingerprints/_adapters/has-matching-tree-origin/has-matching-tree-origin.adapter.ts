import nodeFs from 'node:fs';

import type { TFileFingerprint } from '../../../../_session@shared/_types/file-fingerprint.type.js';

import { readOriginDirents } from '../../../../_session@shared/_adapters/read-origin-dirents/index.js';
import { hasMatchingOriginDirents } from './_adapters/has-matching-origin-dirents/index.js';
import { countOriginExpectedEntries } from './_utils/count-origin-expected-entries/index.js';

export function hasMatchingTreeOrigin(
  expected: ReadonlyMap<string, TFileFingerprint>,
  origin: string
): boolean {
  const originStat = nodeFs.statSync(origin, { throwIfNoEntry: false });
  const expectedOrigin = expected.get(origin);
  if (originStat === undefined) {
    return expectedOrigin !== undefined && expectedOrigin.mtimeMs === -1;
  }
  if (
    expectedOrigin === undefined ||
    expectedOrigin.mtimeMs !== originStat.mtimeMs ||
    expectedOrigin.size !== originStat.size
  ) {
    return false;
  }

  const dirents = readOriginDirents(origin);
  return (
    dirents.length === countOriginExpectedEntries(expected, origin) &&
    hasMatchingOriginDirents(expected, dirents)
  );
}
