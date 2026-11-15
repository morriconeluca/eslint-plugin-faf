import type { TDependencyOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TInventory,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../_norms@shared/_utils/describe-edge-geometry/index.js';

const isEligibleTargetNode = (
  destinationId: number,
  taxonomy: TTaxonomyModel
): boolean => {
  const destinationClassification = taxonomy.byItemId.get(destinationId);
  return (
    destinationClassification !== undefined &&
    destinationClassification.nodeKind !== null &&
    destinationClassification.nodeKind !== 'foreign-node'
  );
};

export function checkPrivateCategoryUnidirectionality(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory
  );
  if (!geometry.sameTree || geometry.firstStepSource === null) {
    return undefined;
  }

  const destinationId = inventory.pathToId.get(edge.destinationPath);
  const destinationItem =
    destinationId === undefined ? undefined : inventory.items[destinationId];
  if (
    destinationId === undefined ||
    destinationItem === undefined ||
    destinationItem.kind !== 'file' ||
    destinationItem.parentId !== geometry.lowestCommonAncestor.id
  ) {
    return undefined;
  }

  const isPrivateSource =
    taxonomy.byItemId.get(geometry.firstStepSource.id)?.relationalQualifications
      .isPrivateCategory === true;

  if (!isPrivateSource || !isEligibleTargetNode(destinationId, taxonomy)) {
    return undefined;
  }

  return createOutcome('dependency/private-category-unidirectionality', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}

export function checkPrivateCategoryVisibility(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory
  );
  if (!geometry.sameTree) {
    return undefined;
  }

  const sourceId = inventory.pathToId.get(edge.sourcePath);
  const sourceItem =
    sourceId === undefined ? undefined : inventory.items[sourceId];
  if (sourceItem === undefined) {
    return undefined;
  }

  const isAuthorizedConsumer = (parentId: number): boolean => {
    if (sourceItem.parentId !== parentId) {
      return false;
    }
    const parentKind = taxonomy.byItemId.get(parentId)?.domainKind;
    const sourceKind = taxonomy.byItemId.get(sourceItem.id)?.nodeKind;
    const isFragmentChild =
      sourceKind === 'master-node' ||
      sourceKind === 'fragment-node' ||
      sourceKind === 'sub-graph-node';
    return parentKind === 'fragment'
      ? isFragmentChild
      : parentKind === 'root-fragment' && sourceKind === 'root-node';
  };

  for (const domain of geometry.descendingDomains) {
    const isPrivate =
      taxonomy.byItemId.get(domain.id)?.relationalQualifications
        .isPrivateCategory === true;
    if (
      isPrivate &&
      domain.parentId !== null &&
      !isAuthorizedConsumer(domain.parentId)
    ) {
      return createOutcome('dependency/private-category-visibility', {
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
