import { compareOrdinal } from '../../../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSegmentElements } from './_utils/compare-segment-elements/index.js';

export function compareSegments(
  left: readonly string[],
  right: readonly string[]
): number {
  const leftSource = left[0] ?? '';
  const rightSource = right[0] ?? '';
  const sourceComparison = compareOrdinal(leftSource, rightSource);
  if (sourceComparison !== 0) {
    return sourceComparison;
  }

  const leftDestination = left.at(-1) ?? '';
  const rightDestination = right.at(-1) ?? '';
  const destinationComparison = compareOrdinal(
    leftDestination,
    rightDestination
  );
  return destinationComparison === 0
    ? compareSegmentElements(left, right)
    : destinationComparison;
}
