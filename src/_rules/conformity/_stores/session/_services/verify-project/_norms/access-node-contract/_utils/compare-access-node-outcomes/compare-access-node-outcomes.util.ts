import type { TOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareAccessNodeOutcomes(
  left: TOutcome,
  right: TOutcome
): number {
  const elementComparison = compareOrdinal(left.element, right.element);
  if (elementComparison !== 0) {
    return elementComparison;
  }

  const constraintComparison = compareOrdinal(
    left.constraint,
    right.constraint
  );
  if (constraintComparison !== 0) {
    return constraintComparison;
  }

  const positionComparison = compareSourceLocations(
    left.position ?? { column: 0, line: 0 },
    right.position ?? { column: 0, line: 0 }
  );
  return positionComparison === 0
    ? compareOrdinal(left.message, right.message)
    : positionComparison;
}
