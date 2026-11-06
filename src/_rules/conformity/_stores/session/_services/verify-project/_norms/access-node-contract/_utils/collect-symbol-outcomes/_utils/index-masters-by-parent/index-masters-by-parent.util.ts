import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function indexMastersByParent(
  classifications: readonly TItemClassification[],
  items: readonly TInventoryItem[]
): ReadonlyMap<number, TItemClassification> {
  const masterMap = new Map<number, TItemClassification>();

  for (const item of classifications) {
    if (item.nodeKind !== 'master-node') {
      continue;
    }
    const inventoryItem = items[item.itemId];
    if (
      inventoryItem?.parentId !== null &&
      inventoryItem?.parentId !== undefined
    ) {
      masterMap.set(inventoryItem.parentId, item);
    }
  }

  return masterMap;
}
