import type {
  TInventory,
  TInventoryItem,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TEdgeGeometry } from '../../../../../_norms@shared/_utils/describe-edge-geometry/index.js';

export function collectCrossedBranches(
  destinationItem: TInventoryItem,
  geometry: TEdgeGeometry,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): readonly TInventoryItem[] {
  if (geometry.sameTree) {
    return geometry.descendingDomains.filter(
      (domain) =>
        taxonomy.byItemId.get(domain.id)?.domainKind === 'fractal-branch'
    );
  }

  const branches: TInventoryItem[] = [];
  let currentParentId = destinationItem.parentId;
  while (currentParentId !== null) {
    const parentDomain = inventory.items[currentParentId];
    if (parentDomain === undefined) {
      break;
    }
    if (
      taxonomy.byItemId.get(parentDomain.id)?.domainKind === 'fractal-branch'
    ) {
      branches.unshift(parentDomain);
    }
    currentParentId = parentDomain.parentId;
  }
  return branches;
}
