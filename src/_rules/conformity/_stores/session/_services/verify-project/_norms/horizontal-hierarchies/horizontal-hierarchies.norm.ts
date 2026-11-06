import type { TClassificationOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { collectMemberOutcomes } from './_utils/collect-member-outcomes/index.js';
import { collectOverlapOutcomes } from './_utils/collect-overlap-outcomes/index.js';

export function verifyHorizontalHierarchies(
  model: TVerificationModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [
    ...collectMemberOutcomes(model.hierarchies.sets, model.taxonomy),
    ...collectOverlapOutcomes(model.hierarchies.conflicts, model.taxonomy),
  ];

  outcomes.sort((left, right) => {
    const byConstraint = compareOrdinal(left.constraint, right.constraint);
    return byConstraint === 0
      ? compareOrdinal(left.element, right.element)
      : byConstraint;
  });

  return outcomes;
}
