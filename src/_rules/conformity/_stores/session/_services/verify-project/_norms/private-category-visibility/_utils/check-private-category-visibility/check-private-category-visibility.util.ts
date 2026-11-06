import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../../_verify-project@shared/_utils/edge-geometry/index.js';

export function checkPrivateCategoryVisibility(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const destinationId = inventory.pathToId.get(edge.destinationPath);
  const sourceId = inventory.pathToId.get(edge.sourcePath);
  if (destinationId === undefined || sourceId === undefined) {
    return undefined;
  }

  const sourceItem = inventory.items[sourceId];
  if (sourceItem === undefined) {
    return undefined;
  }

  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory,
    taxonomy
  );
  if (!geometry.sameTree) {
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
    if (!isPrivate || domain.parentId === null) {
      continue;
    }

    if (!isAuthorizedConsumer(domain.parentId)) {
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
