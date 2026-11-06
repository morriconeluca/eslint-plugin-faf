import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../../_verify-project@shared/_utils/edge-geometry/index.js';

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
    inventory,
    taxonomy
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
