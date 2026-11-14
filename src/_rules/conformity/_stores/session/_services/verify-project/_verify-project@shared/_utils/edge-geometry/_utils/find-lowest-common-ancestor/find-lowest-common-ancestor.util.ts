import type { TInventoryItem } from '../../../../_types/_primitives/inventory.type.js';

export function findLowestCommonAncestor(
  sourceAncestors: readonly TInventoryItem[],
  destinationAncestors: readonly TInventoryItem[]
): number {
  const sourceRoot = sourceAncestors[0];
  const destinationRoot = destinationAncestors[0];
  if (
    sourceRoot === undefined ||
    destinationRoot === undefined ||
    sourceRoot.id !== destinationRoot.id
  ) {
    return -1;
  }

  let lcaIndex = 0;
  let nextSource = sourceAncestors[1];
  let nextDestination = destinationAncestors[1];
  while (
    nextSource !== undefined &&
    nextDestination !== undefined &&
    nextSource.id === nextDestination.id
  ) {
    lcaIndex += 1;
    nextSource = sourceAncestors[lcaIndex + 1];
    nextDestination = destinationAncestors[lcaIndex + 1];
  }
  return lcaIndex;
}
