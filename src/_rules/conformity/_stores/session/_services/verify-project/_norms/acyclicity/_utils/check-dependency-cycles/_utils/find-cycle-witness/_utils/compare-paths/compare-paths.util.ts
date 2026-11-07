import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function comparePaths(
  left: readonly string[],
  right: readonly string[]
): number {
  const leftCopy = [...left];
  const rightCopy = [...right];
  let l = leftCopy.shift();
  let r = rightCopy.shift();
  while (l !== undefined && r !== undefined) {
    const cmp = compareOrdinal(l, r);
    if (cmp !== 0) {
      return cmp;
    }
    l = leftCopy.shift();
    r = rightCopy.shift();
  }
  return left.length - right.length;
}
