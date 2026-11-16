import type {
  TInventory,
  TTaxonomyModel,
} from '../../../../_conformity@shared/_types/verification-model.type.js';

import { compareOrdinal } from '../../../../_conformity@shared/_utils/compare-ordinal/index.js';

export function selectDesignatedRootNodes(
  publicRootNodes: readonly string[],
  originPath: string,
  taxonomy: TTaxonomyModel,
  inventory: TInventory
): readonly string[] {
  const nodes: string[] = [];
  for (const nodePath of publicRootNodes) {
    const classification = taxonomy.byPath.get(nodePath);
    const itemId = inventory.pathToId.get(nodePath);
    const item = itemId === undefined ? undefined : inventory.items[itemId];
    const isRootNode = classification?.nodeKind === 'root-node';
    const isInTree = item?.treeOrigin === originPath;
    if (isRootNode && isInTree) {
      nodes.push(nodePath);
    }
  }
  nodes.sort(compareOrdinal);
  return nodes;
}
