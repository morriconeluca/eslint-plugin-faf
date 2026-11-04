import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { toPosixPath } from '../../../../../../_session@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

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
