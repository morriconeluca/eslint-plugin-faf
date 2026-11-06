import type { TSourceLocation } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Retained reachability candidate demonstrating shortest re-entry for a node pair.
 */
export type TCandidatePath = {
  /**
   * Sequence of relative POSIX file paths from originating tree node to destination.
   */
  readonly chain: readonly string[];

  /**
   * Relative POSIX path of the resolved destination tree node.
   */
  readonly destination: string;

  /**
   * Topological hop count reflecting total real edges across the reachability chain.
   */
  readonly distance: number;

  /**
   * Zero-based index of the initiating import statement in the source module record.
   */
  readonly importIndex: number;

  /**
   * Source coordinates where the originating import reference occurred.
   */
  readonly position: TSourceLocation;

  /**
   * Verbatim module specifier string declared in the originating import statement.
   */
  readonly specifier: string;
};

/**
 * Priority queue encapsulation for reachability traversal states.
 */
export type TPriorityQueue = {
  /**
   * Extracts the state with lowest distance according to topological criteria.
   */
  readonly pop: () => TSearchState | undefined;

  /**
   * Inserts a newly discovered reachability traversal state into the heap.
   */
  readonly push: (state: TSearchState) => void;
};

/**
 * Shared context driving traversal operations during shortest re-entry path discovery.
 */
export type TSearchContext = {
  /**
   * Predicate evaluating whether a target path belongs to the starting tree.
   */
  readonly isTargetTree: (path: string) => boolean;

  /**
   * Priority queue managing undiscovered reachability frontiers.
   */
  readonly queue: TPriorityQueue;

  /**
   * Callback recording a discovered reachability path candidate for a destination.
   */
  readonly recordCandidate: (
    destinationPath: string,
    candidate: TCandidatePath
  ) => void;

  /**
   * Map from source file paths to ordered outgoing transitions.
   */
  readonly transitionsBySource: ReadonlyMap<string, readonly TTransition[]>;

  /**
   * Origin root directory path of the starting fractal tree under inspection.
   */
  readonly treeOrigin: string;
};

/**
 * Search state representing an in-flight reachability traversal.
 */
export type TSearchState = {
  /**
   * Cumulative sequence of relative POSIX file paths traversed so far.
   */
  readonly chain: readonly string[];

  /**
   * Current tree node reached in another tree.
   */
  readonly current: string;

  /**
   * Cumulative edge count along this reachability traversal.
   */
  readonly distance: number;

  /**
   * Whether this traversal has crossed at least one local external file.
   */
  readonly hasExternal: boolean;

  /**
   * Zero-based index of the initiating import in the root source module.
   */
  readonly importIndex: number;

  /**
   * Source coordinates of the initiating import in the root source module.
   */
  readonly position: TSourceLocation;

  /**
   * Verbatim module specifier of the initiating import in the root source module.
   */
  readonly specifier: string;
};

/**
 * Directed step leaving a tree node, either directly or via external files.
 */
export type TTransition = {
  /**
   * Sub-chain of paths traversed by this transition.
   */
  readonly chain: readonly string[];

  /**
   * Relative POSIX path of the resolved target tree node.
   */
  readonly destinationPath: string;

  /**
   * Whether this transition traverses at least one local external file.
   */
  readonly hasExternal: boolean;

  /**
   * Zero-based index of the initiating import statement.
   */
  readonly importIndex: number;

  /**
   * Source coordinates where the initiating import reference occurred.
   */
  readonly position: TSourceLocation;

  /**
   * Verbatim module specifier string declared in the initiating import statement.
   */
  readonly specifier: string;

  /**
   * Number of real edges traversed across this transition.
   */
  readonly weight: number;
};
