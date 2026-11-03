import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../_inventory/_types/inventory.type.js';
import type { TCollectedForeignDomains } from './collect-foreign-domains.type.js';

import { isDescendantOrSelf } from '../../../../../../../_inventory/_utils/is-descendant-or-self/index.js';
import { appendDomainItems } from './_utils/append-domain-items/index.js';

export function collectForeignDomains(
  inventory: TInventory,
  treeItems: readonly TInventoryItem[],
  originItem: TInventoryItem,
  foreignDomains: readonly string[]
): TCollectedForeignDomains {
  const domainItemIds = new Set<number>();
  const domainPaths = new Set<string>();
  const nodeItemIds = new Set<number>();
  const nodePaths = new Set<string>();

  for (const domainPath of foreignDomains) {
    const domainItemId = inventory.pathToId.get(domainPath);
    const domainItem =
      domainItemId === undefined ? undefined : inventory.items[domainItemId];
    if (
      domainItem !== undefined &&
      domainItem.kind === 'directory' &&
      isDescendantOrSelf(domainItem, originItem)
    ) {
      appendDomainItems(
        domainItem,
        treeItems,
        domainItemIds,
        domainPaths,
        nodeItemIds,
        nodePaths
      );
    }
  }

  return { domainItemIds, domainPaths, nodeItemIds, nodePaths };
}
