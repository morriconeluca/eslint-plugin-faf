import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TCollectedForeignDomains } from './collect-foreign-domains.type.js';

import { isDescendantOrSelf } from '../../_select-foreign-nodes@shared/_utils/is-descendant-or-self/index.js';

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

  const appendDomainItems = (domainItem: TInventoryItem): void => {
    for (const item of treeItems) {
      if (!isDescendantOrSelf(item, domainItem)) {
        continue;
      }
      if (item.kind === 'directory') {
        domainItemIds.add(item.id);
        domainPaths.add(item.path);
      } else {
        nodeItemIds.add(item.id);
        nodePaths.add(item.path);
      }
    }
  };

  for (const domainPath of foreignDomains) {
    const domainItemId = inventory.pathToId.get(domainPath);
    const domainItem =
      domainItemId === undefined ? undefined : inventory.items[domainItemId];
    if (
      domainItem !== undefined &&
      domainItem.kind === 'directory' &&
      isDescendantOrSelf(domainItem, originItem)
    ) {
      appendDomainItems(domainItem);
    }
  }

  return { domainItemIds, domainPaths, nodeItemIds, nodePaths };
}
