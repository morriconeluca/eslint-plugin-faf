import type {
  TDependencyOutcome,
  TSourceLocation,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function compareBranchOutcomes(
  left: TDependencyOutcome,
  right: TDependencyOutcome
): number {
  const absentLocation: TSourceLocation = { column: 0, line: 0 };
  const fromComparison = compareOrdinal(left.from, right.from);
  if (fromComparison !== 0) {
    return fromComparison;
  }
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
  const toComparison = compareOrdinal(left.to, right.to);
  if (toComparison !== 0) {
    return toComparison;
  }

  const compareChains = (
    leftChain: readonly string[] | undefined,
    rightChain: readonly string[] | undefined
  ): number => {
    if (leftChain === undefined && rightChain === undefined) {
      return 0;
    }
    if (leftChain === undefined) {
      return -1;
    }
    if (rightChain === undefined) {
      return 1;
    }
    if (leftChain.length !== rightChain.length) {
      return leftChain.length - rightChain.length;
    }
    for (const [index, element] of leftChain.entries()) {
      const segComparison = compareOrdinal(element, rightChain[index] ?? '');
      if (segComparison !== 0) {
        return segComparison;
      }
    }
    return 0;
  };

  const chainComparison = compareChains(left.chain, right.chain);
  return chainComparison === 0
    ? compareOrdinal(left.specifier ?? '', right.specifier ?? '')
    : chainComparison;
}
