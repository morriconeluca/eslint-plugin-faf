import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isExposedLayerNode } from './_utils/is-exposed-layer-node/index.js';

export function collectLayerSurface(
  originPath: string,
  taxonomy: TTaxonomyModel,
  inventory: TInventory
): readonly string[] {
  const nodes: string[] = [];
  for (const item of inventory.items) {
    if (item.treeOrigin !== originPath) {
      continue;
    }
    if (isExposedLayerNode(item.path, originPath, taxonomy)) {
      nodes.push(item.path);
    }
  }
  nodes.sort(compareOrdinal);
  return nodes;
}
