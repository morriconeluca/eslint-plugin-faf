import type { TForeignPatternMatcher } from '../../../../../../../../_domain/_utils/compile-foreign-pattern/index.js';
import type { TInventoryItem } from '../../../../../../../../_inventory/_types/inventory.type.js';

import { isDescendantOrSelf } from '../../../../../../../../_inventory/_utils/is-descendant-or-self/index.js';
import {
  DOT_PATH,
  SLASH,
} from '../../../../_constants/classification-constraints.constant.js';

export function recordScopeMatches(
  treeItems: readonly TInventoryItem[],
  scopeItem: TInventoryItem,
  scopePath: string,
  matchers: readonly TForeignPatternMatcher[],
  nodeItemIds: Set<number>,
  nodePaths: Set<string>
): void {
  for (const item of treeItems) {
    const prefix = `${scopePath}${SLASH}`;
    const prefixedPath = item.path.startsWith(prefix)
      ? item.path.slice(prefix.length)
      : null;
    const relativePath = scopePath === DOT_PATH ? item.path : prefixedPath;
    if (
      relativePath === null ||
      item.kind !== 'file' ||
      !isDescendantOrSelf(item, scopeItem) ||
      matchers.every((matcher) => !matcher(relativePath))
    ) {
      continue;
    }
    nodeItemIds.add(item.id);
    nodePaths.add(item.path);
  }
}
