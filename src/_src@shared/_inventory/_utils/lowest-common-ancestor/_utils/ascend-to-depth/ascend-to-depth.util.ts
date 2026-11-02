import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/inventory.type.js';

export function ascendToDepth(
  item: TInventoryItem,
  targetDepth: number,
  inventory: TInventory
): null | TInventoryItem {
  let current: TInventoryItem = item;
  while (current.depth > targetDepth) {
    if (current.parentId === null) {
      return null;
    }
    const parent = inventory.items[current.parentId];
    if (parent === undefined) {
      return null;
    }
    current = parent;
  }
  return current;
}
