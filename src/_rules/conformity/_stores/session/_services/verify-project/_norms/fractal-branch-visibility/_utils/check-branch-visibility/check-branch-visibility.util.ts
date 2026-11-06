import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../../_verify-project@shared/_utils/edge-geometry/index.js';
import { collectCrossedBranches } from './_utils/collect-crossed-branches/index.js';
import { isBranchAccessForbidden } from './_utils/is-branch-access-forbidden/index.js';

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
    inventory,
    taxonomy
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
      return createOutcome('dependency/fractal-branch-visibility', {
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
