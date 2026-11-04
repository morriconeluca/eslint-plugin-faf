import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TCollectedIndividualForeignNodes } from './collect-individual-foreign-nodes.type.js';

import { isDescendantOrSelf } from '../../_select-foreign-nodes@shared/_utils/is-descendant-or-self/index.js';

export function collectIndividualForeignNodes(
  inventory: TInventory,
  originItem: TInventoryItem,
  individualPaths: readonly string[]
): TCollectedIndividualForeignNodes {
  const nodeItemIds = new Set<number>();
  const nodePaths = new Set<string>();

  for (const filePath of individualPaths) {
    const fileItemId = inventory.pathToId.get(filePath);
    const fileItem =
      fileItemId === undefined ? undefined : inventory.items[fileItemId];
    if (
      !(
        fileItem !== undefined &&
        fileItem.kind === 'file' &&
        isDescendantOrSelf(fileItem, originItem)
      )
    ) {
      continue;
    }

    nodeItemIds.add(fileItem.id);
    nodePaths.add(fileItem.path);
  }

  return { nodeItemIds, nodePaths };
}
