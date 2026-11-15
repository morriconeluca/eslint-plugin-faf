import path from 'node:path';

import type {
  TOutcome,
  TResult,
} from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TRawInventoryEntry } from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { scanTreeOrigin } from './_utils/scan-tree-origin/index.js';

export function listEntries(
  baseDirectory: string,
  origins: readonly string[]
): TResult<readonly TRawInventoryEntry[]> {
  const resolvedBase = path.resolve(baseDirectory);
  const entries: TRawInventoryEntry[] = [];
  const outcomes: TOutcome[] = [];

  for (const rawOrigin of origins) {
    const scanResult = scanTreeOrigin(rawOrigin, resolvedBase);
    for (const outcome of scanResult.outcomes) {
      outcomes.push(outcome);
    }
    for (const entry of scanResult.entries) {
      entries.push(entry);
    }
  }

  return outcomes.length > 0
    ? { ok: false, outcomes }
    : { ok: true, value: entries };
}
