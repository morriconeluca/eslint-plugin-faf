import type { TDependencyOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
  TEffectiveOrientedPair,
  TInventory,
  TTaxonomyModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';

const ELIGIBLE_SOURCE_NODE_KINDS = new Set<string>([
  'category-node',
  'fragment-node',
  'master-node',
  'root-node',
  'sub-graph-node',
  'unauthorized-logical-node',
]);

const isPathOrDescendant = (
  candidatePath: string,
  declaredPath: string
): boolean =>
  declaredPath === '.' ||
  candidatePath === declaredPath ||
  candidatePath.startsWith(`${declaredPath}/`);

export function checkEdgeExternalDependency(
  edge: TEdgeMetadata,
  graph: TDependencyGraph,
  inventory: TInventory,
  taxonomy: TTaxonomyModel,
  authorizedByTree: ReadonlyMap<string, readonly TEffectiveOrientedPair[]>
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

  const nodeKind = taxonomy.byPath.get(edge.sourcePath)?.nodeKind;
  if (!ELIGIBLE_SOURCE_NODE_KINDS.has(nodeKind ?? '')) {
    return undefined;
  }

  const sourceItem = inventory.items[sourceNature.inventoryId];
  const treeOrigin = sourceItem?.treeOrigin;
  if (typeof treeOrigin !== 'string') {
    return undefined;
  }

  const pairs = authorizedByTree.get(treeOrigin);
  const isAuthorized =
    pairs !== undefined &&
    pairs.some(
      (pair) =>
        isPathOrDescendant(edge.sourcePath, pair.from) &&
        isPathOrDescendant(edge.destinationPath, pair.to)
    );
  if (isAuthorized) {
    return undefined;
  }

  return createOutcome.edge('dependency/external-dependencies', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
