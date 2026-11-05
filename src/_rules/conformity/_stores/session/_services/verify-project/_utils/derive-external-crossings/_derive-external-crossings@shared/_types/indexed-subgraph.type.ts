import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

/**
 * Candidate crossing before witness selection for a source-destination pair.
 */
export type TCandidateCrossing = {
  /**
   * Distance in directed edges from the initial external file to the destination.
   */
  readonly distance: number;

  /**
   * Vertex index of the initial external local file reached by the source tree node.
   */
  readonly externalStart: number;

  /**
   * Resolved dependency edge metadata recorded in the dependency graph.
   */
  readonly metadata: TEdgeMetadata;
};

/**
 * Direct entry into a tree destination node from an external local file.
 */
export type TDestinationEntry = {
  /**
   * Vertex index of the tree destination file.
   */
  readonly destinationVertex: number;

  /**
   * Vertex indices of external local files with directed edges to the destination.
   */
  readonly externalSources: readonly number[];
};

/**
 * Pre-indexed graph structure capturing external local files and frontier edges.
 */
export type TIndexedExternalSubgraph = {
  /**
   * Reached tree destinations having at least one incoming edge from an external local file.
   */
  readonly destinations: readonly TDestinationEntry[];

  /**
   * Reverse adjacency lists between external local files.
   */
  readonly reverseExternalEdges: readonly (readonly number[])[];

  /**
   * Incoming directed edges from tree nodes into each external local file.
   */
  readonly treeEdgesByExternal: readonly (readonly TTreeEdge[])[];
};

/**
 * Directed edge originating from a tree node toward an external local file.
 */
export type TTreeEdge = {
  /**
   * Resolved dependency edge metadata recorded in the dependency graph.
   */
  readonly metadata: TEdgeMetadata;

  /**
   * Vertex index of the source tree node.
   */
  readonly sourceVertex: number;
};
