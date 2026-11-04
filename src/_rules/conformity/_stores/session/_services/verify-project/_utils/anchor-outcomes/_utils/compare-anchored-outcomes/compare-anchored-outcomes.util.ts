import type { TAnchoredOutcome } from '../../../../../../_session@shared/_types/anchored-outcome.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareAnchoredOutcomes(
  left: TAnchoredOutcome,
  right: TAnchoredOutcome
): number {
  const pathComparison = compareOrdinal(left.anchorPath, right.anchorPath);
  if (pathComparison !== 0) {
    return pathComparison;
  }
  const constraintComparison = compareOrdinal(
    left.outcome.constraint,
    right.outcome.constraint
  );
  if (constraintComparison !== 0) {
    return constraintComparison;
  }
  const elementComparison = compareOrdinal(
    left.outcome.element,
    right.outcome.element
  );
  if (elementComparison !== 0) {
    return elementComparison;
  }
  const positionComparison = compareSourceLocations(
    left.position,
    right.position
  );
  return positionComparison === 0
    ? compareOrdinal(left.outcome.message, right.outcome.message)
    : positionComparison;
}
