import type {
  TSourceLocation,
  TUnverifiedOutcome,
} from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareUnverifiedOutcomes(
  left: TUnverifiedOutcome,
  right: TUnverifiedOutcome
): number {
  const absentPosition: TSourceLocation = { column: 0, line: 0 };
  const elementOrder = compareOrdinal(left.element, right.element);
  if (elementOrder !== 0) {
    return elementOrder;
  }
  const constraintOrder = compareOrdinal(left.constraint, right.constraint);
  if (constraintOrder !== 0) {
    return constraintOrder;
  }
  const reasonOrder = compareOrdinal(left.reason, right.reason);
  return reasonOrder === 0
    ? compareSourceLocations(
        left.position ?? absentPosition,
        right.position ?? absentPosition
      )
    : reasonOrder;
}
