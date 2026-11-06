import type { TInventoryItem } from '../../../../_types/_primitives/inventory.type.js';

export function findLowestCommonAncestor(
  sourceAncestors: readonly TInventoryItem[],
  destinationAncestors: readonly TInventoryItem[]
): number {
  if (
    sourceAncestors.length === 0 ||
    destinationAncestors.length === 0 ||
    sourceAncestors[0]?.id !== destinationAncestors[0]?.id
  ) {
    return -1;
  }

  const minLength = Math.min(
    sourceAncestors.length,
    destinationAncestors.length
  );
  let lcaIndex = 0;
  while (
    lcaIndex + 1 < minLength &&
    sourceAncestors[lcaIndex + 1]?.id === destinationAncestors[lcaIndex + 1]?.id
  ) {
    lcaIndex += 1;
  }
  return lcaIndex;
}
