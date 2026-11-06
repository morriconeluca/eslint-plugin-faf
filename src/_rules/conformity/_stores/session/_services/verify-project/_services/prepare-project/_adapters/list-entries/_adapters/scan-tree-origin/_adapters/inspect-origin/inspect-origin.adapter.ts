import fs from 'node:fs';

import type { TInspectOriginResult } from './inspect-origin.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
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
        outcome: createOutcome('configuration/missing-origin', {
          element: normalizedOrigin,
          propertyPath: 'faf.locals',
        }),
      };
    }

    return {
      ok: false,
      outcome: createOutcome('unverified/unreadable-origin', {
        detail: error.message,
        element: normalizedOrigin,
        reason: error.message,
      }),
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
      outcome: createOutcome('configuration/invalid-origin', {
        element: normalizedOrigin,
        propertyPath: 'faf.locals',
      }),
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
