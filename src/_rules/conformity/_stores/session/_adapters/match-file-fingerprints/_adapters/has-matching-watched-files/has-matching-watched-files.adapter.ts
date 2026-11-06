import nodeFs from 'node:fs';

import type { TFileFingerprint } from '../../../../_session@shared/_types/file-fingerprint.type.js';

export function hasMatchingWatchedFiles(
  expected: ReadonlyMap<string, TFileFingerprint>,
  watchedFiles: readonly string[]
): boolean {
  for (const filePath of watchedFiles) {
    const stat = nodeFs.statSync(filePath, { throwIfNoEntry: false });
    const expectedItem = expected.get(filePath);
    const mtimeMs = stat?.mtimeMs ?? -1;
    const size = stat?.size ?? -1;
    if (
      expectedItem === undefined ||
      expectedItem.mtimeMs !== mtimeMs ||
      expectedItem.size !== size
    ) {
      return false;
    }
  }
  return true;
}
