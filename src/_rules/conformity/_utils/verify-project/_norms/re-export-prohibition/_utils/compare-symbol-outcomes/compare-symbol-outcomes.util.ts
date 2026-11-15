import type { TSymbolOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareSymbolOutcomes(
  left: TSymbolOutcome,
  right: TSymbolOutcome
): number {
  const elementComparison = compareOrdinal(left.element, right.element);
  if (elementComparison !== 0) {
    return elementComparison;
  }
  const positionComparison = compareSourceLocations(
    left.position ?? { column: 0, line: 0 },
    right.position ?? { column: 0, line: 0 }
  );
  return positionComparison === 0
    ? compareOrdinal(left.message, right.message)
    : positionComparison;
}
