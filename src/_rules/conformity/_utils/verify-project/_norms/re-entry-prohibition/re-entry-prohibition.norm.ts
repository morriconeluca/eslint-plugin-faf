import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { compareReEntryOutcomes } from './_utils/compare-re-entry-outcomes/index.js';
import { findReEntryPaths } from './_utils/find-re-entry-paths/index.js';

export function verifyReEntryProhibition(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes = findReEntryPaths(model);
  const sorted: TDependencyOutcome[] = [...outcomes];
  sorted.sort(compareReEntryOutcomes);
  return sorted;
}
