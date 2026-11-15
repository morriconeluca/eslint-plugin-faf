import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function sortConfigOutcomes(
  outcomes: readonly TConfigOutcome[]
): readonly TConfigOutcome[] {
  const copy = [...outcomes];
  copy.sort((left, right) => {
    const pathComparison = compareOrdinal(
      left.propertyPath,
      right.propertyPath
    );
    if (pathComparison !== 0) {
      return pathComparison;
    }
    const constraintComparison = compareOrdinal(
      left.constraint,
      right.constraint
    );
    return constraintComparison === 0
      ? compareOrdinal(left.element, right.element)
      : constraintComparison;
  });
  return copy;
}
