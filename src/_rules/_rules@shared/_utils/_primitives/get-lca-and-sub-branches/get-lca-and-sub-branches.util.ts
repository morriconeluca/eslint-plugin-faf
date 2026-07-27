/**
 * Finds the Lowest Common Ancestor (LCA) path of two given path strings,
 * as well as the immediate child segment of the LCA for each path.
 * Used to identify parent-child relationships and siblings.
 *
 * @param pathA - First path string.
 * @param pathB - Second path string.
 * @returns Object containing the LCA and immediate sub-branches, or null if no common ancestor.
 */
export function getLcaAndSubBranches(
  pathA: string,
  pathB: string
): null | { lca: string; subA: string; subB: string } {
  const partsA = pathA.split('/');
  const partsB = pathB.split('/');

  let commonLength = 0;
  while (
    commonLength < partsA.length &&
    commonLength < partsB.length &&
    partsA[commonLength] === partsB[commonLength]
  ) {
    commonLength++;
  }

  if (commonLength === 0) {
    return null;
  }

  const lca = partsA.slice(0, commonLength).join('/');
  const subA = partsA[commonLength] || '';
  const subB = partsB[commonLength] || '';

  return { lca, subA, subB };
}
