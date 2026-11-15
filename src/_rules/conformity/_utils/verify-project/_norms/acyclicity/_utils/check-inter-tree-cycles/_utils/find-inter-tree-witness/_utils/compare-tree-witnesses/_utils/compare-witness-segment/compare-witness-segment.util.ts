import { compareOrdinal } from '../../../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function compareWitnessSegment(
  leftSegment: readonly string[],
  rightSegment: readonly string[]
): number {
  const sourceComparison = compareOrdinal(
    leftSegment[0] ?? '',
    rightSegment[0] ?? ''
  );
  return sourceComparison === 0
    ? compareOrdinal(leftSegment.at(-1) ?? '', rightSegment.at(-1) ?? '')
    : sourceComparison;
}
