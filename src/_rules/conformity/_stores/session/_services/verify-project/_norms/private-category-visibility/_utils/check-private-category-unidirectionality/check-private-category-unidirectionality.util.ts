import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../../_verify-project@shared/_utils/edge-geometry/index.js';

export function checkPrivateCategoryUnidirectionality(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const destinationId = inventory.pathToId.get(edge.destinationPath);
  if (destinationId === undefined) {
    return undefined;
  }

  const destinationItem = inventory.items[destinationId];
  if (destinationItem === undefined || destinationItem.kind !== 'file') {
    return undefined;
  }

  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory,
    taxonomy
  );
  if (
    !geometry.sameTree ||
    geometry.firstStepSource === null ||
    destinationItem.parentId !== geometry.lowestCommonAncestor.id
  ) {
    return undefined;
  }

  const isEligibleTarget = (): boolean => {
    const classification = taxonomy.byItemId.get(destinationId);
    return (
      classification !== undefined &&
      classification.nodeKind !== null &&
      classification.nodeKind !== 'foreign-node'
    );
  };

  const isPrivateSource =
    taxonomy.byItemId.get(geometry.firstStepSource.id)?.relationalQualifications
      .isPrivateCategory === true;

  if (!isPrivateSource || !isEligibleTarget()) {
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
