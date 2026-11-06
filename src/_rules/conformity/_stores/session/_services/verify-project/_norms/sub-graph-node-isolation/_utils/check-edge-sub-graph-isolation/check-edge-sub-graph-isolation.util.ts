import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function checkEdgeSubGraphIsolation(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const destinationId = inventory.pathToId.get(edge.destinationPath);
  const destinationClassification =
    destinationId === undefined
      ? undefined
      : taxonomy.byItemId.get(destinationId);
  if (destinationClassification?.nodeKind !== 'sub-graph-node') {
    return undefined;
  }

  const sourceId = inventory.pathToId.get(edge.sourcePath);
  const sourceClassification =
    sourceId === undefined ? undefined : taxonomy.byItemId.get(sourceId);
  const isLogicalNode =
    sourceClassification !== undefined &&
    sourceClassification.nodeKind !== null &&
    sourceClassification.nodeKind !== 'foreign-node';
  if (!isLogicalNode) {
    return undefined;
  }

  return createOutcome('dependency/sub-graph-node-isolation', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
