import nodePath from 'node:path';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function findInventoryItem(
  inventory: TInventory,
  baseDirectory: string,
  element: string
): TInventoryItem | undefined {
  const normalizedId = inventory.pathToId.get(element.replaceAll('\\', '/'));
  if (normalizedId !== undefined) {
    return inventory.items[normalizedId];
  }
  if (!nodePath.isAbsolute(element)) {
    return undefined;
  }
  const relativeId = inventory.pathToId.get(
    nodePath.relative(baseDirectory, element).replaceAll('\\', '/')
  );
  return relativeId === undefined ? undefined : inventory.items[relativeId];
}
