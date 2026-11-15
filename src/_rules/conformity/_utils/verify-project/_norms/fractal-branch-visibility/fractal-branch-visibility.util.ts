import type { TDependencyOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TInventory,
  TInventoryItem,
  TItemClassification,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';
import type { TEdgeGeometry } from '../_norms@shared/_utils/describe-edge-geometry/index.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../_norms@shared/_utils/describe-edge-geometry/index.js';

export function checkBranchVisibility(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const sourceId = inventory.pathToId.get(edge.sourcePath);
  if (sourceId === undefined) {
    return undefined;
  }

  const destinationId = inventory.pathToId.get(edge.destinationPath);
  const destinationItem =
    destinationId === undefined ? undefined : inventory.items[destinationId];
  if (destinationItem === undefined) {
    return undefined;
  }

  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory
  );

  const branchesToVerify = collectCrossedBranches(
    destinationItem,
    geometry,
    inventory,
    taxonomy
  );

  const sourceItem = inventory.items[sourceId];
  const sourceClassification = taxonomy.byItemId.get(sourceId);

  for (const branchItem of branchesToVerify) {
    const parentItem =
      typeof branchItem.parentId === 'number'
        ? inventory.items[branchItem.parentId]
        : undefined;
    if (
      parentItem !== undefined &&
      isBranchAccessForbidden(
        parentItem,
        sourceItem,
        sourceClassification,
        geometry,
        taxonomy
      )
    ) {
      return createOutcome.edge('dependency/fractal-branch-visibility', {
        from: edge.sourcePath,
        importIndex: edge.importIndex,
        position: edge.position,
        specifier: edge.specifier,
        to: edge.destinationPath,
      });
    }
  }

  return undefined;
}

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
