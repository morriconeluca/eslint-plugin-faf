import fs from 'node:fs';
import path from 'node:path';

import type { TOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TRawInventoryEntry } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TScanTreeOriginResult } from './scan-tree-origin.type.js';

import { toPosixPath } from '../../../../../../../../_session@shared/_utils/to-posix-path/index.js';
import { assertInvariant } from '../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { inspectOrigin } from './_adapters/inspect-origin/index.js';
import { processDirent } from './_adapters/process-dirent/index.js';

export function scanTreeOrigin(
  rawOrigin: string,
  resolvedBase: string
): TScanTreeOriginResult {
  const posixOrigin = toPosixPath(rawOrigin);
  const withoutPrefix = posixOrigin.startsWith('./')
    ? posixOrigin.slice(2)
    : posixOrigin;
  const normalizedOrigin = withoutPrefix.endsWith('/')
    ? withoutPrefix.slice(0, -1)
    : withoutPrefix;

  const originAbs = path.resolve(resolvedBase, normalizedOrigin);
  const entries: TRawInventoryEntry[] = [];
  const outcomes: TOutcome[] = [];

  const inspection = inspectOrigin(originAbs, normalizedOrigin, resolvedBase);

  if (!inspection.ok) {
    outcomes.push(inspection.outcome);
    return { entries, outcomes };
  }

  entries.push({
    isSymlink: inspection.isSymlink,
    kind: 'directory',
    path: normalizedOrigin,
    realPath: inspection.originReal,
  });

  if (inspection.isSymlink) {
    return { entries, outcomes };
  }

  const queue: string[] = [originAbs];

  const processDirectory = (
    currentDirectoryAbsolute: string
  ): {
    readonly directoriesToVisit: readonly string[];
    readonly entries: readonly TRawInventoryEntry[];
    readonly outcomes: readonly TOutcome[];
  } => {
    let directoryEntries: fs.Dirent[];
    try {
      directoryEntries = fs.readdirSync(currentDirectoryAbsolute, {
        withFileTypes: true,
      });
    } catch (error: unknown) {
      assertInvariant(error instanceof Error, 'Expected file system error');
      const relativeDirectory = toPosixPath(
        path.relative(resolvedBase, currentDirectoryAbsolute)
      );
      return {
        directoriesToVisit: [],
        entries: [],
        outcomes: [
          {
            constraint: 'unverified/unreadable-entry',
            element: relativeDirectory,
            family: 'unverified',
            message: `Directory '${relativeDirectory}' could not be read: ${error.message}`,
            normativeReference: '§6',
            reason: error.message,
          },
        ],
      };
    }

    directoryEntries.sort((left, right) =>
      compareOrdinal(left.name, right.name)
    );

    const stepEntries: TRawInventoryEntry[] = [];
    const stepOutcomes: TOutcome[] = [];
    const stepDirectories: string[] = [];

    for (const dirent of directoryEntries) {
      const result = processDirent(
        dirent,
        currentDirectoryAbsolute,
        resolvedBase
      );
      if (result.entry !== undefined) {
        stepEntries.push(result.entry);
      }
      if (result.outcome !== undefined) {
        stepOutcomes.push(result.outcome);
      }
      if (result.directoryToVisit !== undefined) {
        stepDirectories.push(result.directoryToVisit);
      }
    }

    return {
      directoriesToVisit: stepDirectories,
      entries: stepEntries,
      outcomes: stepOutcomes,
    };
  };

  while (queue.length > 0) {
    const currentDirectoryAbsolute = queue.shift();
    assertInvariant(
      currentDirectoryAbsolute !== undefined,
      'Queue cannot be empty'
    );

    const step = processDirectory(currentDirectoryAbsolute);
    for (const outcome of step.outcomes) {
      outcomes.push(outcome);
    }
    for (const entry of step.entries) {
      entries.push(entry);
    }
    for (const directory of step.directoriesToVisit) {
      queue.push(directory);
    }
  }

  return { entries, outcomes };
}
