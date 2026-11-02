import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/inventory.type.js';

export function climbToCommonAncestor(
  startA: null | TInventoryItem,
  startB: null | TInventoryItem,
  inventory: TInventory
): null | TInventoryItem {
  if (startA === null || startB === null) {
    return null;
  }

  let currentA: TInventoryItem = startA;
  let currentB: TInventoryItem = startB;

  while (currentA.id !== currentB.id) {
    if (currentA.parentId === null || currentB.parentId === null) {
      return null;
    }
    const nextA = inventory.items[currentA.parentId];
    const nextB = inventory.items[currentB.parentId];
    if (nextA === undefined || nextB === undefined) {
      return null;
    }
    currentA = nextA;
    currentB = nextB;
  }

  return currentA;
}
