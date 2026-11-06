import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function hasTaxonomicConflict(
  children: readonly TInventoryItem[],
  taxonomy: TTaxonomyModel
): boolean {
  let hasSubCategories = false;
  let hasFragments = false;
  let hasCategoryNodes = false;

  for (const child of children) {
    const classification = taxonomy.byItemId.get(child.id);
    const domainKind = classification?.domainKind;
    hasSubCategories ||=
      domainKind === 'sub-category' || domainKind === 'path-sub-category';
    hasFragments ||= domainKind === 'fragment';
    hasCategoryNodes ||= classification?.nodeKind === 'category-node';
  }

  const subCategoryPresence = hasSubCategories ? 1 : 0;
  const fragmentPresence = hasFragments ? 1 : 0;
  const categoryNodePresence = hasCategoryNodes ? 1 : 0;
  return subCategoryPresence + fragmentPresence + categoryNodePresence > 1;
}
