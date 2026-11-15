import type {
  TInventoryItem,
  TItemClassification,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TEdgeGeometry } from '../../../../../_norms@shared/_utils/describe-edge-geometry/index.js';

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
