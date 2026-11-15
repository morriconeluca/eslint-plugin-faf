import type {
  TInventoryItem,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

export function groupChildrenByParentId(
  items: readonly TInventoryItem[]
): ReadonlyMap<number, readonly TInventoryItem[]> {
  const grouped = new Map<number, TInventoryItem[]>();
  for (const item of items) {
    if (item.parentId === null) {
      continue;
    }
    const siblings = grouped.get(item.parentId);
    if (siblings === undefined) {
      grouped.set(item.parentId, [item]);
    } else {
      siblings.push(item);
    }
  }
  return grouped;
}

export function hasCategoryContentConflict(
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

export function hasLayerCategoryConflict(
  children: readonly TInventoryItem[],
  taxonomy: TTaxonomyModel
): boolean {
  let hasCategories = false;
  let hasLayers = false;

  for (const child of children) {
    const classification = taxonomy.byItemId.get(child.id);
    const domainKind = classification?.domainKind;
    hasCategories ||= domainKind === 'category';
    hasLayers ||= domainKind === 'layer';
  }

  return hasCategories && hasLayers;
}
