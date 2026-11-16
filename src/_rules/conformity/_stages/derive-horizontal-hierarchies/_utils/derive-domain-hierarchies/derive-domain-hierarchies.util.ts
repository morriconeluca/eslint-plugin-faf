import type { TFAFHierarchy } from '../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  THorizontalHierarchySet,
  TItemClassification,
  TLogicalDomainKind,
  TSiblingRank,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { THierarchyContext } from '../../_derive-horizontal-hierarchies@shared/_types/hierarchy-context.type.js';

import { compareOrdinal } from '../../../../_conformity@shared/_utils/compare-ordinal/index.js';

export function deriveDomainHierarchies(
  context: THierarchyContext
): readonly Omit<THorizontalHierarchySet, 'id'>[] {
  const SUB_CATEGORY_DOMAIN = 'sub-category' as const;

  const isSubCategoryEligibleParent = (
    domainKind: null | TLogicalDomainKind | undefined
  ): boolean => domainKind === 'category' || domainKind === SUB_CATEGORY_DOMAIN;

  const isOrderableSiblingSet = (
    parent: TItemClassification | undefined,
    children: readonly (TItemClassification | undefined)[]
  ): boolean => {
    if (
      parent?.domainKind === 'category' ||
      parent?.domainKind === SUB_CATEGORY_DOMAIN
    ) {
      return children.length > 0
        ? children.every((child) => child?.domainKind === SUB_CATEGORY_DOMAIN)
        : !parent.relationalQualifications.isParentCategory;
    }
    const isStratified =
      parent?.domainKind === 'layer' ||
      parent?.domainKind === 'root-layer' ||
      parent?.domainKind === 'fractal-branch';
    return (
      isStratified &&
      (children.every((child) => child?.domainKind === 'layer') ||
        children.every((child) => child?.domainKind === 'category'))
    );
  };

  const collectSiblings = (
    hierarchy: TFAFHierarchy,
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

  const buildSet = (
    hierarchy: TFAFHierarchy,
    siblings: readonly TSiblingRank[],
    origin: THorizontalHierarchySet['origin'],
    isOrderable: boolean
  ): Omit<THorizontalHierarchySet, 'id'> => {
    const names = hierarchy.flat();
    const repetitions = [
      ...new Set(names.filter((name, index) => names.indexOf(name) !== index)),
    ];
    repetitions.sort(compareOrdinal);
    return {
      isOrderable,
      origin,
      parentPath: context.parent.path,
      repetitions,
      siblings,
    };
  };

  const classification = context.taxonomy.byItemId.get(context.parent.id);
  const sets: Omit<THorizontalHierarchySet, 'id'>[] = [];

  if (isSubCategoryEligibleParent(classification?.domainKind)) {
    for (const model of context.tree.horizontalHierarchyModels) {
      const siblings = collectSiblings(model, true);
      if (siblings.length === 0) {
        continue;
      }
      sets.push(buildSet(model, siblings, 'horizontal-hierarchy-model', true));
    }
  }

  for (const entry of context.tree.horizontalHierarchies) {
    if (entry.path !== context.parent.path) {
      continue;
    }
    const siblings = collectSiblings(entry.hierarchy, false);
    const memberClassifications = siblings.map((sibling) =>
      context.taxonomy.byItemId.get(sibling.itemId)
    );
    const isOrderable = isOrderableSiblingSet(
      classification,
      memberClassifications
    );
    sets.push(
      buildSet(entry.hierarchy, siblings, 'horizontal-hierarchy', isOrderable)
    );
  }

  return sets;
}
