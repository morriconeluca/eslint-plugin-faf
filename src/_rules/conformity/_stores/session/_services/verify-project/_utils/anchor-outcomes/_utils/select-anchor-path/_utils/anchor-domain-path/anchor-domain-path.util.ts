import type { TTaxonomyModel } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { lintableChildren } from './_utils/lintable-children/index.js';

export function anchorDomainPath(
  inventory: TInventory,
  model: TTaxonomyModel | undefined,
  domain: TInventoryItem
): string | undefined {
  let current: TInventoryItem | undefined = domain;
  while (current !== undefined) {
    const children = lintableChildren(inventory, current.id);
    const classification = model?.byPath.get(current.path);
    const isFragment = classification?.domainKind === 'fragment';
    const master =
      isFragment && model !== undefined
        ? children.find(
            (child) => model.byItemId.get(child.id)?.nodeKind === 'master-node'
          )
        : undefined;
    if (master !== undefined) {
      return master.path;
    }
    const firstChild = children[0];
    if (firstChild !== undefined) {
      return firstChild.path;
    }
    current =
      current.parentId === null ? undefined : inventory.items[current.parentId];
  }
  return undefined;
}
