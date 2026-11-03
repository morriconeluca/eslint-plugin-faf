import type { TConfigOutcome } from '../../../../../../_domain/_types/outcome.type.js';

import { compareOrdinal } from '../../../../../../_domain/_utils/compare-ordinal/index.js';

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
