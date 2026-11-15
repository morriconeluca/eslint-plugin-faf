import type {
  TClassificationOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import {
  collectFragmentItems,
  inspectFragmentDomain,
  inspectFragmentNodes,
} from './fragment-anatomy.util.js';

export function verifyFragmentAnatomy(
  model: TVerificationModel
): readonly TOutcome[] {
  const inspections = collectFragmentItems(model);

  const outcomes: TClassificationOutcome[] = [];
  for (const inspection of inspections) {
    outcomes.push(
      ...inspectFragmentDomain(inspection),
      ...inspectFragmentNodes(inspection)
    );
  }

  outcomes.sort((left, right) => {
    const byConstraint = compareOrdinal(left.constraint, right.constraint);
    return byConstraint === 0
      ? compareOrdinal(left.element, right.element)
      : byConstraint;
  });

  return outcomes;
}
