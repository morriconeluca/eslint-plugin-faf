import type { TOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import {
  collectSourceOutcomes,
  collectSymbolOutcomes,
  compareAccessNodeOutcomes,
} from './access-node-contract.util.js';

export function verifyAccessNodeContract(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TOutcome[] = [
    ...collectSourceOutcomes(model),
    ...collectSymbolOutcomes(model),
  ];

  outcomes.sort(compareAccessNodeOutcomes);
  return outcomes;
}
