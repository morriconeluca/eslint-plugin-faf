import type { TFAFHierarchy } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TLogicalDomainKind } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  THorizontalHierarchySet,
  TSiblingRank,
} from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type { THierarchyContext } from '../../_derive-horizontal-hierarchies@shared/_types/hierarchy-context.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isOrderableSiblingSet } from './_utils/is-orderable-sibling-set/index.js';

export const deriveDomainHierarchies = (() => {
  const SUB_CATEGORY_DOMAIN = 'sub-category' as const;

  const isSubCategoryEligibleParent = (
    domainKind: null | TLogicalDomainKind | undefined
  ): boolean => domainKind === 'category' || domainKind === SUB_CATEGORY_DOMAIN;

  const collectRepetitions = (hierarchy: TFAFHierarchy): readonly string[] => {
    const names = hierarchy.flat();
    const repetitions = [
      ...new Set(names.filter((name, index) => names.indexOf(name) !== index)),
    ];
    repetitions.sort(compareOrdinal);
    return repetitions;
  };

  const collectSiblings = (
    hierarchy: TFAFHierarchy,
    context: THierarchyContext,
    isSubCategoryOnly: boolean
  ): readonly TSiblingRank[] =>
    hierarchy.flatMap((tier, rank) => {
      const orderedNames = [...tier];
      orderedNames.sort(compareOrdinal);
      return orderedNames.flatMap((name) =>
        context.children
          .filter(
            (child) =>
              child.path.split('/').at(-1) === name &&
              (!isSubCategoryOnly ||
                context.taxonomy.byItemId.get(child.id)?.domainKind ===
                  SUB_CATEGORY_DOMAIN)
          )
          .map((child) => ({ itemId: child.id, rank }))
      );
    });

  return function deriveDomainHierarchies(
    context: THierarchyContext
  ): readonly Omit<THorizontalHierarchySet, 'id'>[] {
    const classification = context.taxonomy.byItemId.get(context.parent.id);
    const sets: Omit<THorizontalHierarchySet, 'id'>[] = [];

    if (isSubCategoryEligibleParent(classification?.domainKind)) {
      for (const model of context.tree.horizontalHierarchyModels) {
        const siblings = collectSiblings(model, context, true);
        if (siblings.length === 0) {
          continue;
        }
        sets.push({
          isOrderable: true,
          origin: 'horizontal-hierarchy-model',
          parentPath: context.parent.path,
          repetitions: collectRepetitions(model),
          siblings,
        });
      }
    }

    for (const entry of context.tree.horizontalHierarchies) {
      if (entry.path !== context.parent.path) {
        continue;
      }
      const siblings = collectSiblings(entry.hierarchy, context, false);
      sets.push({
        isOrderable: isOrderableSiblingSet(
          classification,
          siblings.map((sibling) =>
            context.taxonomy.byItemId.get(sibling.itemId)
          )
        ),
        origin: 'horizontal-hierarchy',
        parentPath: context.parent.path,
        repetitions: collectRepetitions(entry.hierarchy),
        siblings,
      });
    }

    return sets;
  };
})();
