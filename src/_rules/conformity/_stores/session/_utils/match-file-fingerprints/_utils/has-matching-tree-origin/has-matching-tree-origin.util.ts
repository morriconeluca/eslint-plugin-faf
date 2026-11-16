import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFileFingerprint } from '../../../../_session@shared/_types/file-fingerprint.type.js';

import { readOriginDirents } from '../../../../_session@shared/_utils/read-origin-dirents/index.js';

export function hasMatchingTreeOrigin(
  expected: ReadonlyMap<string, TFileFingerprint>,
  origin: string
): boolean {
  const countOriginExpectedEntries = (): number => {
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
  };

  const hasMatchingOriginDirents = (
    dirents: readonly nodeFs.Dirent[]
  ): boolean => {
    for (const dirent of dirents) {
      const entryPath = nodePath.join(dirent.parentPath, dirent.name);
      const stat = nodeFs.statSync(entryPath, { throwIfNoEntry: false });
      const expectedItem = expected.get(entryPath);
      if (expectedItem === undefined) {
        return false;
      }
      if (stat === undefined) {
        if (expectedItem.mtimeMs !== -1) {
          return false;
        }
        continue;
      }
      if (
        expectedItem.mtimeMs !== stat.mtimeMs ||
        expectedItem.size !== stat.size
      ) {
        return false;
      }
    }
    return true;
  };

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
    dirents.length === countOriginExpectedEntries() &&
    hasMatchingOriginDirents(dirents)
  );
}
