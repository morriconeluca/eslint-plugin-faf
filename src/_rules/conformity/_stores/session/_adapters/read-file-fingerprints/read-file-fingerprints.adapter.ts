import type { TFileFingerprint } from '../../_session@shared/_types/file-fingerprint.type.js';

import { readFileSnapshot } from '../../_session@shared/_adapters/read-file-snapshot/index.js';

export function readFileFingerprints(
  paths: readonly string[]
): ReadonlyMap<string, TFileFingerprint> {
  const fingerprints = new Map<string, TFileFingerprint>();
  for (const filePath of paths) {
    const snapshot = readFileSnapshot(filePath);
    fingerprints.set(
      filePath,
      snapshot.present
        ? { mtimeMs: snapshot.mtimeMs, path: filePath, size: snapshot.size }
        : { mtimeMs: -1, path: filePath, size: -1 }
    );
  }
  return fingerprints;
}
