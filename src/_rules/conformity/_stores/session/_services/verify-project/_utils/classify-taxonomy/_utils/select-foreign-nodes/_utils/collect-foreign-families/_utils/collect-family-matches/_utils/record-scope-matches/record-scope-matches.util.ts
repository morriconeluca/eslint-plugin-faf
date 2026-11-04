import type { TInventoryItem } from '../../../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TForeignPatternMatcher } from '../../../../../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';

import {
  DOT_PATH,
  SLASH,
} from '../../../../../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { isDescendantOrSelf } from '../../../../../../_select-foreign-nodes@shared/_utils/is-descendant-or-self/index.js';

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
