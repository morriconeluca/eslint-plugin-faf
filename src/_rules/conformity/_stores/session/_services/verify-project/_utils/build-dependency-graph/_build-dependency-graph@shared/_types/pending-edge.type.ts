import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

/**
 * Local dependency edge before compressed-sparse-row indexing.
 */
export type TPendingEdge = {
  /**
   * Destination vertex index in the ordered vertex list.
   */
  readonly destinationVertex: number;

  /**
   * Domain metadata copied into the assembled graph.
   */
  readonly metadata: TEdgeMetadata;

  /**
   * Source vertex index in the ordered vertex list.
   */
  readonly sourceVertex: number;
};
