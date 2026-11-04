import type { TConfigOutcome } from '../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareOrdinal } from '../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function compareConfigOutcomes(
  left: TConfigOutcome,
  right: TConfigOutcome
): number {
  const byConstraint = compareOrdinal(left.constraint, right.constraint);
  if (byConstraint !== 0) {
    return byConstraint;
  }
  const byElement = compareOrdinal(left.element, right.element);
  return byElement === 0
    ? compareOrdinal(left.propertyPath, right.propertyPath)
    : byElement;
}
