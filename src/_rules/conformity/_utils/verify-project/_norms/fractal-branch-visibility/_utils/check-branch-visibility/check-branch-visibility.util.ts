import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TInventory,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../_norms@shared/_utils/describe-edge-geometry/index.js';
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
