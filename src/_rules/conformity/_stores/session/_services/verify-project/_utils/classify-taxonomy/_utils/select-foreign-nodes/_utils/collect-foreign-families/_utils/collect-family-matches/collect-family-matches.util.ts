import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TForeignPatternMatcher } from '../../../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';

import { assertInvariant } from '../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { isDescendantOrSelf } from '../../../../_select-foreign-nodes@shared/_utils/is-descendant-or-self/index.js';
import { recordScopeMatches } from './_utils/record-scope-matches/index.js';

export function collectFamilyMatches(
  inventory: TInventory,
  treeItems: readonly TInventoryItem[],
  originItem: TInventoryItem,
  scopePaths: readonly string[],
  matchers: readonly TForeignPatternMatcher[],
  nodeItemIds: Set<number>,
  nodePaths: Set<string>
): void {
  for (const scopePath of scopePaths) {
    const scopeItemId = inventory.pathToId.get(scopePath);
    if (scopeItemId === undefined) {
      continue;
    }
    const scopeItem = inventory.items[scopeItemId];
    assertInvariant(scopeItem !== undefined, 'scope id is indexed');
    if (isDescendantOrSelf(scopeItem, originItem)) {
      recordScopeMatches(
        treeItems,
        scopeItem,
        scopePath,
        matchers,
        nodeItemIds,
        nodePaths
      );
    }
  }
}
