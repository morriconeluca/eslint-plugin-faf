import type { TFileFingerprint } from '../../_session@shared/_types/file-fingerprint.type.js';

import { readFileSnapshot } from '../../_session@shared/_adapters/read-file-snapshot/index.js';

export function hasMatchingFileFingerprints(
  expected: ReadonlyMap<string, TFileFingerprint>,
  paths: readonly string[]
): boolean {
  const current = new Map<string, TFileFingerprint>();
  for (const filePath of paths) {
    const snapshot = readFileSnapshot(filePath);
    current.set(
      filePath,
      snapshot.present
        ? { mtimeMs: snapshot.mtimeMs, path: filePath, size: snapshot.size }
        : { mtimeMs: -1, path: filePath, size: -1 }
    );
  }
  if (current.size !== expected.size) {
    return false;
  }
  for (const [filePath, item] of expected) {
    const other = current.get(filePath);
    if (
      other === undefined ||
      item.mtimeMs !== other.mtimeMs ||
      item.size !== other.size
    ) {
      return false;
    }
  }
  return true;
}
