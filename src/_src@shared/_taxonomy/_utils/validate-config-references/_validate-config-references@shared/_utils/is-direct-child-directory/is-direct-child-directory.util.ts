import type { TInventory } from '../../../../../../_inventory/_types/inventory.type.js';

import { isPhysicalDirectChild } from './_utils/is-physical-direct-child/index.js';
import { isStringDirectChild } from './_utils/is-string-direct-child/index.js';

export function isDirectChildDirectory(
  inventory: TInventory,
  childPath: string,
  parentPath: string
): boolean {
  return (
    isStringDirectChild(childPath, parentPath) &&
    isPhysicalDirectChild(inventory, childPath, parentPath)
  );
}
