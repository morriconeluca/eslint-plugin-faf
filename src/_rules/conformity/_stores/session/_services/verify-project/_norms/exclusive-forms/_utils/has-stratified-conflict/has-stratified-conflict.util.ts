import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function hasStratifiedConflict(
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
