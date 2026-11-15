import type {
  TEffectiveForeignFamily,
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TForeignPatternMatcher } from '../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';
import type { TCollectedForeignFamilies } from './collect-foreign-families.type.js';

import { assertInvariant } from '../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { compileForeignPattern } from '../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';
import {
  DOT_PATH,
  SLASH,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { isDescendantOrSelf } from '../../_select-foreign-nodes@shared/_utils/is-descendant-or-self/index.js';

export function collectForeignFamilies(
  inventory: TInventory,
  treeItems: readonly TInventoryItem[],
  originItem: TInventoryItem,
  families: readonly TEffectiveForeignFamily[]
): TCollectedForeignFamilies {
  const nodeItemIds = new Set<number>();
  const nodePaths = new Set<string>();

  const recordScopeMatches = (
    scopeItem: TInventoryItem,
    scopePath: string,
    matchers: readonly TForeignPatternMatcher[]
  ): void => {
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
  };

  const collectFamilyMatches = (
    scopePaths: readonly string[],
    patterns: readonly string[]
  ): void => {
    const matchers: TForeignPatternMatcher[] = [];
    for (const pattern of patterns) {
      const compiled = compileForeignPattern(pattern);
      if (compiled.ok) {
        matchers.push(compiled.matcher);
      }
    }
    for (const scopePath of scopePaths) {
      const scopeItemId = inventory.pathToId.get(scopePath);
      if (scopeItemId === undefined) {
        continue;
      }
      const scopeItem = inventory.items[scopeItemId];
      assertInvariant(scopeItem !== undefined, 'scope id is indexed');
      if (isDescendantOrSelf(scopeItem, originItem)) {
        recordScopeMatches(scopeItem, scopePath, matchers);
      }
    }
  };

  for (const family of families) {
    collectFamilyMatches(family.paths, family.patterns);
  }

  return { nodeItemIds, nodePaths };
}
