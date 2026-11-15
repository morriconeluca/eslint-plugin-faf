import { compareWitnessSegment } from './_utils/compare-witness-segment/index.js';

export function compareTreeWitnesses(
  left: readonly (readonly string[])[],
  right: readonly (readonly string[])[]
): number {
  const leftCopy = [...left];
  const rightCopy = [...right];
  let l = leftCopy.shift();
  let r = rightCopy.shift();
  while (l !== undefined && r !== undefined) {
    const cmp = compareWitnessSegment(l, r);
    if (cmp !== 0) {
      return cmp;
    }
    l = leftCopy.shift();
    r = rightCopy.shift();
  }
  return left.length - right.length;
}
