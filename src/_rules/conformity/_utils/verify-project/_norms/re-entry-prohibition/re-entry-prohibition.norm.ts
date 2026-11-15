import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { findReEntryPaths } from './_utils/find-re-entry-paths/index.js';
import { compareReEntryOutcomes } from './re-entry-prohibition.util.js';

export function verifyReEntryProhibition(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes = findReEntryPaths(model);
  const sorted: TDependencyOutcome[] = [...outcomes];
  sorted.sort(compareReEntryOutcomes);
  return sorted;
}
