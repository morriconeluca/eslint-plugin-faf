import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { checkCyclicAuthorizations } from './_utils/check-cyclic-authorizations/index.js';
import { checkDependencyCycles } from './_utils/check-dependency-cycles/index.js';
import { checkInterTreeCycles } from './_utils/check-inter-tree-cycles/index.js';

export function verifyAcyclicity(
  model: TVerificationModel
): readonly TOutcome[] {
  const dependencyCycles = checkDependencyCycles(model);
  const interTreeCycles = checkInterTreeCycles(model);
  const cyclicAuthorizations = checkCyclicAuthorizations(
    model,
    interTreeCycles,
    dependencyCycles
  );

  const outcomes: TOutcome[] = [
    ...dependencyCycles,
    ...interTreeCycles,
    ...cyclicAuthorizations,
  ];

  outcomes.sort((left, right) => {
    const elementComparison = compareOrdinal(left.element, right.element);
    return elementComparison === 0
      ? compareOrdinal(left.constraint, right.constraint)
      : elementComparison;
  });

  return outcomes;
}
