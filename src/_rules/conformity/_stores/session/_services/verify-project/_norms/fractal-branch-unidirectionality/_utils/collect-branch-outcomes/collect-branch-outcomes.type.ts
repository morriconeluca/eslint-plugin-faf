import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

/**
 * Shortest path record documenting an unauthorized dependency from a source to a consumer node.
 */
export type TViolationPath = {
  /**
   * Ordered sequence of relative POSIX file paths traversed from source to destination.
   */
  readonly chain: readonly string[];

  /**
   * Structural metadata of the initial outgoing edge originating this path.
   */
  readonly firstEdge: TEdgeMetadata;

  /**
   * Target node dependency graph vertex identifier.
   */
  readonly targetVertex: number;
};
