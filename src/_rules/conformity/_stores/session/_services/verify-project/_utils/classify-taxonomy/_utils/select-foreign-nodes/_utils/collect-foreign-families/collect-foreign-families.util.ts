import type { TEffectiveForeignFamily } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TCollectedForeignFamilies } from './collect-foreign-families.type.js';

import { collectFamilyMatches } from './_utils/collect-family-matches/index.js';
import { compileFamilyMatchers } from './_utils/compile-family-matchers/index.js';

export function collectForeignFamilies(
  inventory: TInventory,
  treeItems: readonly TInventoryItem[],
  originItem: TInventoryItem,
  families: readonly TEffectiveForeignFamily[]
): TCollectedForeignFamilies {
  const nodeItemIds = new Set<number>();
  const nodePaths = new Set<string>();

  for (const family of families) {
    collectFamilyMatches(
      inventory,
      treeItems,
      originItem,
      family.paths,
      compileFamilyMatchers(family.patterns),
      nodeItemIds,
      nodePaths
    );
  }

  return { nodeItemIds, nodePaths };
}
