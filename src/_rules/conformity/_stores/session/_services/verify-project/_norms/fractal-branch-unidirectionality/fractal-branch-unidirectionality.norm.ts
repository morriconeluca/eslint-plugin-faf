import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { collectBranchOutcomes } from './_utils/collect-branch-outcomes/index.js';
import { compareBranchOutcomes } from './_utils/compare-branch-outcomes/index.js';

export function verifyFractalBranchUnidirectionality(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes = collectBranchOutcomes(model);
  const sorted = [...outcomes];
  sorted.sort(compareBranchOutcomes);
  return sorted;
}
