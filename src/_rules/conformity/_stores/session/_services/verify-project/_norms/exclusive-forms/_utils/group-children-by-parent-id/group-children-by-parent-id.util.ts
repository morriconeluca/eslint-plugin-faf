import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function groupChildrenByParentId(
  items: readonly TInventoryItem[]
): ReadonlyMap<number, readonly TInventoryItem[]> {
  const grouped = new Map<number, TInventoryItem[]>();
  for (const item of items) {
    if (item.parentId === null) {
      continue;
    }
    const siblings = grouped.get(item.parentId);
    if (siblings === undefined) {
      grouped.set(item.parentId, [item]);
    } else {
      siblings.push(item);
    }
  }
  return grouped;
}
