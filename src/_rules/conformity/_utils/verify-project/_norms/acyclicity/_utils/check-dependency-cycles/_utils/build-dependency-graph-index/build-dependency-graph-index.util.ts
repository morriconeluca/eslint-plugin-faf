import type {
  TEdgeMetadata,
  TVerificationModel,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TDependencyGraphIndex } from './build-dependency-graph-index.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function buildDependencyGraphIndex(
  model: TVerificationModel
): TDependencyGraphIndex {
  const collectLogicalNodePaths = (): readonly string[] => {
    const paths: string[] = [];
    for (const item of model.basis.inventory.items) {
      if (item.kind !== 'file' || item.treeOrigin === null) {
        continue;
      }
      const classification = model.taxonomy.byItemId.get(item.id);
      if (
        classification !== undefined &&
        classification.nodeKind !== null &&
        classification.nodeKind !== 'foreign-node'
      ) {
        paths.push(item.path);
      }
    }
    const sorted = [...paths];
    sorted.sort(compareOrdinal);
    return sorted;
  };

  const logicalPaths = collectLogicalNodePaths();
  const nodeCount = logicalPaths.length;

  const pathToIndex = new Map<string, number>();
  for (const [index, logicalPath] of logicalPaths.entries()) {
    pathToIndex.set(logicalPath, index);
  }

  const adjacency: number[][] = Array.from({ length: nodeCount }, () => []);
  const reverseAdjacency: number[][] = Array.from(
    { length: nodeCount },
    () => []
  );
  const selfLoopSet = new Set<number>();
  const edgeBySourceAndDestination = new Map<string, TEdgeMetadata>();

  for (const edge of model.graph.edgeMetadata) {
    const sourceIndex = pathToIndex.get(edge.sourcePath);
    const targetIndex = pathToIndex.get(edge.destinationPath);
    if (sourceIndex === undefined || targetIndex === undefined) {
      continue;
    }
    const key = `${edge.sourcePath}\0${edge.destinationPath}`;
    if (!edgeBySourceAndDestination.has(key)) {
      edgeBySourceAndDestination.set(key, edge);
    }
    if (sourceIndex === targetIndex) {
      selfLoopSet.add(sourceIndex);
    } else {
      adjacency[sourceIndex]?.push(targetIndex);
      reverseAdjacency[targetIndex]?.push(sourceIndex);
    }
  }

  const [cleanAdjacency = [], cleanReverseAdjacency = []] = [
    adjacency,
    reverseAdjacency,
  ].map((matrix) =>
    matrix.map((row) => {
      const sorted = [...row];
      sorted.sort(
        (leftNeighbor, rightNeighbor) => leftNeighbor - rightNeighbor
      );
      const deduped: number[] = [];
      for (const neighbor of sorted) {
        if (deduped.at(-1) !== neighbor) {
          deduped.push(neighbor);
        }
      }
      return deduped;
    })
  );

  return {
    adjacency: cleanAdjacency,
    edgeBySourceAndDestination,
    logicalPaths,
    nodeCount,
    revAdjacency: cleanReverseAdjacency,
    selfLoopSet,
  };
}
