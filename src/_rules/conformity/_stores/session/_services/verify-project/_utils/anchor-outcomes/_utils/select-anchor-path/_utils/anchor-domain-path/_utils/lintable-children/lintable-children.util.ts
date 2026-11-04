import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isLintablePath } from '../../../../_select-anchor-path@shared/_utils/is-lintable-path/index.js';

export function lintableChildren(
  inventory: TInventory,
  parentId: number
): readonly TInventoryItem[] {
  const children: TInventoryItem[] = [];
  for (const item of inventory.items) {
    if (
      item.parentId === parentId &&
      item.kind === 'file' &&
      isLintablePath(item.path)
    ) {
      children.push(item);
    }
  }
  const ordered = [...children];
  ordered.sort((left, right) => compareOrdinal(left.path, right.path));
  return ordered;
}
