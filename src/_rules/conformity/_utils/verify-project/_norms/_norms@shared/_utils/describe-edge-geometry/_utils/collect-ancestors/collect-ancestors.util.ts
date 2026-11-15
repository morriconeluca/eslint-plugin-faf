import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

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
