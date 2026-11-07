import type { TEdgeMetadata } from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

/**
 * Compact index representation of the logical nodes dependency graph.
 */
export type TDependencyGraphIndex = {
  /**
   * Forward adjacency list mapping vertex index to target vertex indices.
   */
  readonly adjacency: readonly (readonly number[])[];

  /**
   * Fast lookup from source and destination path pair to original edge metadata.
   */
  readonly edgeBySourceAndDestination: ReadonlyMap<string, TEdgeMetadata>;

  /**
   * Ordered sequence of all indexed logical node paths.
   */
  readonly logicalPaths: readonly string[];

  /**
   * Total count of indexed logical node vertices.
   */
  readonly nodeCount: number;

  /**
   * Reverse adjacency list mapping vertex index to source vertex indices.
   */
  readonly revAdjacency: readonly (readonly number[])[];

  /**
   * Set of vertex indices that have direct self-loop edges.
   */
  readonly selfLoopSet: ReadonlySet<number>;
};
