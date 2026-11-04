import fs from 'node:fs';

import type { TInspectOriginResult } from './inspect-origin.type.js';

import { assertInvariant } from '../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { toRelativeRealPath } from '../../_scan-tree-origin@shared/_utils/to-relative-real-path/index.js';

export function inspectOrigin(
  originAbs: string,
  normalizedOrigin: string,
  resolvedBase: string
): TInspectOriginResult {
  let originLstat: fs.Stats;
  try {
    originLstat = fs.lstatSync(originAbs);
  } catch (error: unknown) {
    assertInvariant(error instanceof Error, 'Expected file system error');
    const isEnoent = 'code' in error && error.code === 'ENOENT';

    if (isEnoent) {
      return {
        ok: false,
        outcome: {
          constraint: 'configuration/missing-origin',
          element: normalizedOrigin,
          family: 'configuration',
          message: `Tree origin directory '${normalizedOrigin}' does not exist.`,
          normativeReference: '§6',
          propertyPath: 'faf.locals',
        },
      };
    }

    return {
      ok: false,
      outcome: {
        constraint: 'unverified/unreadable-origin',
        element: normalizedOrigin,
        family: 'unverified',
        message: `Tree origin directory '${normalizedOrigin}' could not be read: ${error.message}`,
        normativeReference: '§6',
        reason: error.message,
      },
    };
  }

  const isOriginSymlink = originLstat.isSymbolicLink();
  let isDirectory = originLstat.isDirectory();
  if (isOriginSymlink) {
    try {
      const targetStat = fs.statSync(originAbs);
      isDirectory = targetStat.isDirectory();
    } catch {
      isDirectory = false;
    }
  }

  if (!isDirectory) {
    return {
      ok: false,
      outcome: {
        constraint: 'configuration/invalid-origin',
        element: normalizedOrigin,
        family: 'configuration',
        message: `Tree origin '${normalizedOrigin}' must be a directory.`,
        normativeReference: '§6',
        propertyPath: 'faf.locals',
      },
    };
  }

  const originReal = isOriginSymlink
    ? toRelativeRealPath(fs.realpathSync(originAbs), resolvedBase)
    : normalizedOrigin;

  return {
    isSymlink: isOriginSymlink,
    ok: true,
    originReal,
  };
}
