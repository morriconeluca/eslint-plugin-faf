import type { TEdgeMetadata } from '../../../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

export function populateAdjacencyEdges(
  edgeMetadata: readonly TEdgeMetadata[],
  pathToIndex: ReadonlyMap<string, number>,
  adjacency: number[][],
  revAdjacency: number[][],
  selfLoopSet: Set<number>,
  edgeBySourceAndDestination: Map<string, TEdgeMetadata>
): void {
  for (const edge of edgeMetadata) {
    const u = pathToIndex.get(edge.sourcePath);
    const v = pathToIndex.get(edge.destinationPath);
    if (u === undefined || v === undefined) {
      continue;
    }
    const key = `${edge.sourcePath}\0${edge.destinationPath}`;
    if (!edgeBySourceAndDestination.has(key)) {
      edgeBySourceAndDestination.set(key, edge);
    }
    if (u === v) {
      selfLoopSet.add(u);
    } else {
      adjacency[u]?.push(v);
      revAdjacency[v]?.push(u);
    }
  }
}
