import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function checkEdgeExternalDependency(
  edge: TEdgeMetadata,
  graph: TDependencyGraph,
  inventory: TInventory,
  taxonomy: TTaxonomyModel,
  authorizedPairs: ReadonlySet<string>
): TDependencyOutcome | undefined {
  const destinationVertex = graph.pathToVertex.get(edge.destinationPath);
  const destinationNature =
    destinationVertex === undefined
      ? undefined
      : graph.vertexNatures[destinationVertex];
  if (destinationNature?.kind !== 'external-local-file') {
    return undefined;
  }

  const sourceVertex = graph.pathToVertex.get(edge.sourcePath);
  const sourceNature =
    sourceVertex === undefined ? undefined : graph.vertexNatures[sourceVertex];
  if (sourceNature?.kind !== 'tree-node') {
    return undefined;
  }

  const eligibleNodeKinds = new Set<string>([
    'category-node',
    'fragment-node',
    'master-node',
    'root-node',
    'sub-graph-node',
    'unauthorized-logical-node',
  ]);
  const nodeKind = taxonomy.byPath.get(edge.sourcePath)?.nodeKind;
  if (!eligibleNodeKinds.has(nodeKind ?? '')) {
    return undefined;
  }

  const sourceItem = inventory.items[sourceNature.inventoryId];
  const treeOrigin = sourceItem?.treeOrigin;
  if (typeof treeOrigin !== 'string') {
    return undefined;
  }

  const authorizationKey = `${treeOrigin}\0${edge.sourcePath}\0${edge.destinationPath}`;
  if (authorizedPairs.has(authorizationKey)) {
    return undefined;
  }

  return createOutcome('dependency/external-dependencies', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
