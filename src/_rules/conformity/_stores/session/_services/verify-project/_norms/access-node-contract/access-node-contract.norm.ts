import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { collectSourceOutcomes } from './_utils/collect-source-outcomes/index.js';
import { collectSymbolOutcomes } from './_utils/collect-symbol-outcomes/index.js';
import { compareAccessNodeOutcomes } from './_utils/compare-access-node-outcomes/index.js';

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
