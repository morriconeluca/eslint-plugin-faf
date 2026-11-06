import type {
  TDependencyOutcome,
  TSourceLocation,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareReEntryOutcomes(
  left: TDependencyOutcome,
  right: TDependencyOutcome
): number {
  const fromComparison = compareOrdinal(left.from, right.from);
  if (fromComparison !== 0) {
    return fromComparison;
  }
  const toComparison = compareOrdinal(left.to, right.to);
  if (toComparison !== 0) {
    return toComparison;
  }
  const absentLocation: TSourceLocation = { column: 0, line: 0 };
  const positionComparison = compareSourceLocations(
    left.position ?? absentLocation,
    right.position ?? absentLocation
  );
  if (positionComparison !== 0) {
    return positionComparison;
  }
  if (left.importIndex !== right.importIndex) {
    return left.importIndex - right.importIndex;
  }
  return compareOrdinal(left.specifier ?? '', right.specifier ?? '');
}
