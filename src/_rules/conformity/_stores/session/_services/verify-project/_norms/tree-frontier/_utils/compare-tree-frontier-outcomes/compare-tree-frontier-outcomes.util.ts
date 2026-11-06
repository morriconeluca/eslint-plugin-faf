import type {
  TDependencyOutcome,
  TSourceLocation,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareTreeFrontierOutcomes(
  left: TDependencyOutcome,
  right: TDependencyOutcome
): number {
  const absentLocation: TSourceLocation = { column: 0, line: 0 };
  const comparisons = [
    compareOrdinal(left.from, right.from),
    compareSourceLocations(
      left.position ?? absentLocation,
      right.position ?? absentLocation
    ),
    left.importIndex - right.importIndex,
    compareOrdinal(left.to, right.to),
    compareOrdinal(left.specifier ?? '', right.specifier ?? ''),
    compareOrdinal(left.constraint, right.constraint),
    compareOrdinal(
      (left.chain ?? []).join('\0'),
      (right.chain ?? []).join('\0')
    ),
    compareOrdinal(left.message, right.message),
  ];

  for (const diff of comparisons) {
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}
