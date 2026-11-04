import nodePath from 'node:path';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { toPosixPath } from '../../../../../../../../_session@shared/_utils/to-posix-path/index.js';

export function findInventoryItem(
  inventory: TInventory,
  baseDirectory: string,
  element: string
): TInventoryItem | undefined {
  const normalizedId = inventory.pathToId.get(toPosixPath(element));
  if (normalizedId !== undefined) {
    return inventory.items[normalizedId];
  }
  if (!nodePath.isAbsolute(element)) {
    return undefined;
  }
  const relativeId = inventory.pathToId.get(
    toPosixPath(nodePath.relative(baseDirectory, element))
  );
  return relativeId === undefined ? undefined : inventory.items[relativeId];
}
