import type {
  TClassificationOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { collectFragmentItems } from './_utils/collect-fragment-items/index.js';
import { inspectFragmentDomain } from './_utils/inspect-fragment-domain/index.js';
import { inspectFragmentNodes } from './_utils/inspect-fragment-nodes/index.js';

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
