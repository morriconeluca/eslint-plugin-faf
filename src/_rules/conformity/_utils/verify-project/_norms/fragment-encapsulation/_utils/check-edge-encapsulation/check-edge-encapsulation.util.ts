import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TInventory,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../_norms@shared/_utils/describe-edge-geometry/index.js';

export function checkEdgeEncapsulation(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const destinationId = inventory.pathToId.get(edge.destinationPath);
  if (destinationId === undefined) {
    return undefined;
  }

  const destinationClassification = taxonomy.byItemId.get(destinationId);
  const isFragmentNode =
    destinationClassification?.nodeKind === 'master-node' ||
    destinationClassification?.nodeKind === 'fragment-node';
  if (!isFragmentNode) {
    return undefined;
  }

  const destinationItem = inventory.items[destinationId];
  if (destinationItem === undefined || destinationItem.parentId === null) {
    return undefined;
  }

  const parentItem = inventory.items[destinationItem.parentId];
  if (parentItem === undefined) {
    return undefined;
  }

  const parentClassification = taxonomy.byItemId.get(parentItem.id);
  if (parentClassification?.domainKind !== 'fragment') {
    return undefined;
  }

  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory
  );
  if (!geometry.sameTree || geometry.isSourceInside(parentItem)) {
    return undefined;
  }

  return createOutcome('dependency/fragment-encapsulation', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
