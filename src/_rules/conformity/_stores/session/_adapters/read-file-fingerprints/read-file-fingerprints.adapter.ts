import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFileFingerprint } from '../../_session@shared/_types/file-fingerprint.type.js';
import type { TReadFileFingerprintsInput } from './read-file-fingerprints.type.js';

import { readOriginDirents } from '../../_session@shared/_adapters/read-origin-dirents/index.js';

export function readFileFingerprints(
  input: TReadFileFingerprintsInput
): ReadonlyMap<string, TFileFingerprint> {
  const fingerprints = new Map<string, TFileFingerprint>();
  const watchedFiles = input.watchedFiles ?? [];

  for (const filePath of watchedFiles) {
    const stat = nodeFs.statSync(filePath, { throwIfNoEntry: false });
    fingerprints.set(
      filePath,
      stat === undefined
        ? { mtimeMs: -1, path: filePath, size: -1 }
        : { mtimeMs: stat.mtimeMs, path: filePath, size: stat.size }
    );
  }

  const treeOrigins = input.treeOrigins ?? [];
  for (const origin of treeOrigins) {
    const originStat = nodeFs.statSync(origin, { throwIfNoEntry: false });
    if (originStat === undefined) {
      fingerprints.set(origin, { mtimeMs: -1, path: origin, size: -1 });
      continue;
    }
    fingerprints.set(origin, {
      mtimeMs: originStat.mtimeMs,
      path: origin,
      size: originStat.size,
    });
    for (const dirent of readOriginDirents(origin)) {
      const entryPath = nodePath.join(dirent.parentPath, dirent.name);
      const stat = nodeFs.statSync(entryPath, { throwIfNoEntry: false });
      if (stat !== undefined) {
        fingerprints.set(entryPath, {
          mtimeMs: stat.mtimeMs,
          path: entryPath,
          size: stat.size,
        });
      }
    }
  }

  return fingerprints;
}
