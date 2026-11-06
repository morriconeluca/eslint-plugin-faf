import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/_primitives/inventory.type.js';

export function collectAncestors(
  item: TInventoryItem,
  inventory: TInventory
): readonly TInventoryItem[] {
  const chain: TInventoryItem[] = [];
  let current: TInventoryItem | undefined = item;
  while (current !== undefined) {
    chain.unshift(current);
    current =
      current.parentId === null ? undefined : inventory.items[current.parentId];
  }
  return chain;
}
