import type { TInventoryItem } from '../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isDescendantOrSelf } from '../../../../_select-foreign-nodes@shared/_utils/is-descendant-or-self/index.js';

export function appendDomainItems(
  domainItem: TInventoryItem,
  treeItems: readonly TInventoryItem[],
  domainItemIds: Set<number>,
  domainPaths: Set<string>,
  nodeItemIds: Set<number>,
  nodePaths: Set<string>
): void {
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
}
