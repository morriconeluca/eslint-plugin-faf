import type { TEdgeMetadata } from '../../../../_conformity@shared/_types/verification-model.type.js';

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
