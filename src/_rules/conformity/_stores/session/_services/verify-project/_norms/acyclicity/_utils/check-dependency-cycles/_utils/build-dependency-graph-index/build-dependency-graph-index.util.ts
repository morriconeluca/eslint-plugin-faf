import type { TEdgeMetadata } from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type { TDependencyGraphIndex } from './build-dependency-graph-index.type.js';

import { collectLogicalNodePaths } from './_utils/collect-logical-node-paths/index.js';
import { deduplicateNeighborRow } from './_utils/deduplicate-neighbor-row/index.js';
import { populateAdjacencyEdges } from './_utils/populate-adjacency-edges/index.js';

export function buildDependencyGraphIndex(
  model: TVerificationModel
): TDependencyGraphIndex {
  const logicalPaths = collectLogicalNodePaths(model);
  const nodeCount = logicalPaths.length;

  const pathToIndex = new Map<string, number>();
  for (const [index, p] of logicalPaths.entries()) {
    pathToIndex.set(p, index);
  }

  const adjacency: number[][] = Array.from({ length: nodeCount }, () => []);
  const revAdjacency: number[][] = Array.from({ length: nodeCount }, () => []);
  const selfLoopSet = new Set<number>();
  const edgeBySourceAndDestination = new Map<string, TEdgeMetadata>();

  populateAdjacencyEdges(
    model.graph.edgeMetadata,
    pathToIndex,
    adjacency,
    revAdjacency,
    selfLoopSet,
    edgeBySourceAndDestination
  );

  const cleanAdjacency: (readonly number[])[] = [];
  const cleanRevAdjacency: (readonly number[])[] = [];

  for (const row of adjacency) {
    cleanAdjacency.push(deduplicateNeighborRow(row));
  }

  for (const revRow of revAdjacency) {
    cleanRevAdjacency.push(deduplicateNeighborRow(revRow));
  }

  return {
    adjacency: cleanAdjacency,
    edgeBySourceAndDestination,
    logicalPaths,
    nodeCount,
    revAdjacency: cleanRevAdjacency,
    selfLoopSet,
  };
}
