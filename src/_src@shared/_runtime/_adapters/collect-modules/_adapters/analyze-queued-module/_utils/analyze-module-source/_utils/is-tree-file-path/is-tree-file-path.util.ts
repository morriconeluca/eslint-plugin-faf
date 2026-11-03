import type { TInventory } from '../../../../../../../../../_inventory/_types/inventory.type.js';

export function isTreeFilePath(inventory: TInventory, path: string): boolean {
  const id = inventory.pathToId.get(path);
  if (id === undefined) {
    return false;
  }
  const item = inventory.items[id];
  return item !== undefined && item.kind === 'file' && item.treeOrigin !== null;
}
