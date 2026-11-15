import type { TOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { collectBranchOutcomes } from './_utils/collect-branch-outcomes/index.js';
import { compareBranchOutcomes } from './fractal-branch-unidirectionality.util.js';

export function verifyFractalBranchUnidirectionality(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes = collectBranchOutcomes(model);
  const sorted = [...outcomes];
  sorted.sort(compareBranchOutcomes);
  return sorted;
}
