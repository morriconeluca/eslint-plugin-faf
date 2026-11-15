import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFileFingerprint } from '../../../../../../_session@shared/_types/file-fingerprint.type.js';

export function hasMatchingOriginDirents(
  expected: ReadonlyMap<string, TFileFingerprint>,
  dirents: readonly nodeFs.Dirent[]
): boolean {
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
}
