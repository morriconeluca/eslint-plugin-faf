import type { TInventory } from '../../../../../_inventory/_types/inventory.type.js';

import { compareOrdinal } from '../../../../../_domain/_utils/compare-ordinal/index.js';
import { toPosixPath } from '../../../../../_domain/_utils/to-posix-path/index.js';

export function selectTreeFilePaths(inventory: TInventory): readonly string[] {
  const paths = new Set<string>();
  for (const item of inventory.items) {
    if (item.kind === 'file' && item.treeOrigin !== null) {
      paths.add(toPosixPath(item.path));
    }
  }
  const ordered = [...paths];
  ordered.sort(compareOrdinal);
  return ordered;
}
