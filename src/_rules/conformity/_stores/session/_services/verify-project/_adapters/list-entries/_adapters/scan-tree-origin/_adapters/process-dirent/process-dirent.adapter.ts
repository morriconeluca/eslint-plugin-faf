import fs from 'node:fs';
import path from 'node:path';

import type { TEntryKind } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TProcessDirentResult } from './process-dirent.type.js';

import { assertInvariant } from '../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { toRelativeRealPath } from '../../_scan-tree-origin@shared/_utils/to-relative-real-path/index.js';
import { UNREADABLE_ENTRY_CONSTRAINT } from './process-dirent.constant.js';

export function processDirent(
  dirent: fs.Dirent,
  currentDirectoryAbsolute: string,
  resolvedBase: string
): TProcessDirentResult {
  const itemAbsolute = path.join(currentDirectoryAbsolute, dirent.name);
  const itemRelative = path
    .relative(resolvedBase, itemAbsolute)
    .replaceAll('\\', '/');

  if (dirent.isSymbolicLink()) {
    try {
      const rawReal = fs.realpathSync(itemAbsolute);
      const realPath = toRelativeRealPath(rawReal, resolvedBase);
      const targetStat = fs.statSync(rawReal);
      let kind: TEntryKind = 'file';
      if (targetStat.isDirectory()) {
        kind = 'directory';
      }
      return {
        entry: { isSymlink: true, kind, path: itemRelative, realPath },
      };
    } catch (error: unknown) {
      assertInvariant(error instanceof Error, 'Expected file system error');
      return {
        outcome: {
          constraint: UNREADABLE_ENTRY_CONSTRAINT,
          element: itemRelative,
          family: 'unverified',
          message: `Entry '${itemRelative}' could not be inspected: ${error.message}`,
          normativeReference: '§6',
          reason: error.message,
        },
      };
    }
  }

  if (dirent.isDirectory()) {
    return {
      directoryToVisit: itemAbsolute,
      entry: {
        isSymlink: false,
        kind: 'directory',
        path: itemRelative,
        realPath: itemRelative,
      },
    };
  }

  return {
    entry: {
      isSymlink: false,
      kind: 'file',
      path: itemRelative,
      realPath: itemRelative,
    },
  };
}
