import type { TInventory } from '../../../../../../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isPhysicalDirectChild(
  inventory: TInventory,
  childPath: string,
  parentPath: string
): boolean {
  const childId = inventory.pathToId.get(childPath);
  if (childId === undefined) {
    return true;
  }

  const parentId = inventory.pathToId.get(parentPath);
  if (parentId === undefined) {
    return false;
  }

  const child = inventory.items[childId];
  if (child === undefined) {
    return true;
  }

  const parent = inventory.items[parentId];
  return parent !== undefined && child.parentId === parent.id;
}
