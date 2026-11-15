import type {
  TDependencyGraph,
  TEdgeMetadata,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

/**
 * Shortest path record documenting an unauthorized dependency from a source to a consumer node.
 */
export type TBranchViolationPath = {
  /**
   * Ordered sequence of relative POSIX file paths traversed from source to destination.
   */
  readonly chain: readonly string[];

  /**
   * Structural metadata of the initial outgoing edge originating this path.
   */
  readonly firstEdge: TEdgeMetadata;

  /**
   * Relative POSIX path of the originating branch node.
   */
  readonly sourcePath: string;

  /**
   * Target node dependency graph vertex identifier.
   */
  readonly targetVertex: number;
};

/**
 * Candidate branch source vertex eligible for unidirectionality exploration.
 */
export type TCandidateBranchSource = {
  /**
   * Directory tree depth used to process deepest branch nodes first for memoization.
   */
  readonly depth: number;

  /**
   * Relative POSIX path of the candidate branch node.
   */
  readonly path: string;

  /**
   * Dependency graph vertex index of the candidate source.
   */
  readonly vertex: number;
};

/**
 * Input parameters for shortest branch unidirectionality violation path discovery.
 */
export type TFindBranchViolationPathsInput = {
  /**
   * Candidate branch source vertices to explore.
   */
  readonly candidateSources: readonly TCandidateBranchSource[];

  /**
   * Project dependency graph in compressed sparse row layout.
   */
  readonly graph: TDependencyGraph;

  /**
   * Predicate evaluating whether a direct or transitive reachability edge violates unidirectionality.
   */
  readonly isViolation: (
    sourcePath: string,
    destinationPath: string
  ) => boolean;
};

/**
 * Breadth-first traversal queue entry tracking the partial path and originating edge.
 */
export type TQueueItem = {
  /**
   * Ordered sequence of relative POSIX file paths traversed up to the current vertex.
   */
  readonly chain: readonly string[];

  /**
   * Current dependency graph vertex index being explored.
   */
  readonly current: number;

  /**
   * Metadata of the initial outgoing edge from the originating branch source.
   */
  readonly firstEdge: TEdgeMetadata;
};
