import type { TFileFingerprint } from '../../_session@shared/_types/file-fingerprint.type.js';
import type { TMatchFileFingerprintsInput } from './match-file-fingerprints.type.js';

import { hasMatchingTreeOrigin } from './_adapters/has-matching-tree-origin/index.js';
import { hasMatchingWatchedFiles } from './_adapters/has-matching-watched-files/index.js';

export function hasMatchingFileFingerprints(
  expected: ReadonlyMap<string, TFileFingerprint>,
  input: TMatchFileFingerprintsInput
): boolean {
  if (!hasMatchingWatchedFiles(expected, input.watchedFiles ?? [])) {
    return false;
  }
  const treeOrigins = input.treeOrigins ?? [];
  for (const origin of treeOrigins) {
    if (!hasMatchingTreeOrigin(expected, origin)) {
      return false;
    }
  }
  return true;
}
