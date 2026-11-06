import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TEdgeGeometry } from '../../../../../../_verify-project@shared/_utils/edge-geometry/index.js';

export function isBranchAccessForbidden(
  parentItem: TInventoryItem,
  sourceItem: TInventoryItem | undefined,
  sourceClassification: TItemClassification | undefined,
  geometry: TEdgeGeometry,
  taxonomy: TTaxonomyModel
): boolean {
  if (
    sourceClassification === undefined ||
    sourceClassification.nodeKind === 'foreign-node' ||
    !geometry.isSourceInside(parentItem)
  ) {
    return true;
  }

  const parentClassification = taxonomy.byItemId.get(parentItem.id);
  const isParentFragment =
    parentClassification?.domainKind === 'fragment' ||
    parentClassification?.domainKind === 'root-fragment';

  return (
    isParentFragment &&
    sourceClassification.nodeKind === 'access-node' &&
    sourceItem?.parentId === parentItem.id
  );
}
