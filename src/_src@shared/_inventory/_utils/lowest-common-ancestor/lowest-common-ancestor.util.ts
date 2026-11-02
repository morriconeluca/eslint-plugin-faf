import type {
  TInventory,
  TInventoryItem,
} from '../../_types/inventory.type.js';

import { ascendToDepth } from './_utils/ascend-to-depth/index.js';
import { climbToCommonAncestor } from './_utils/climb-to-common-ancestor/index.js';

export function lowestCommonAncestor(
  itemA: TInventoryItem,
  itemB: TInventoryItem,
  inventory: TInventory
): null | TInventoryItem {
  if (itemA.treeOrigin === null || itemA.treeOrigin !== itemB.treeOrigin) {
    return null;
  }

  const currentA = ascendToDepth(itemA, itemB.depth, inventory);
  const currentB = ascendToDepth(itemB, itemA.depth, inventory);

  return climbToCommonAncestor(currentA, currentB, inventory);
}
