import type { TSourceLocation } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Quotient graph representing directed dependency relations between distinct trees.
 */
export type TQuotientGraph = {
  /**
   * Adjacency list mapping tree index to adjacent tree indices.
   */
  readonly adjacency: readonly (readonly number[])[];

  /**
   * Lookup translating tree origin path to unique integer tree index.
   */
  readonly originToIndex: ReadonlyMap<string, number>;

  /**
   * Matrix of candidate transitions connecting source and destination trees.
   */
  readonly transitions: readonly (readonly (null | TTransition)[])[];

  /**
   * Total number of indexed trees in the quotient graph.
   */
  readonly treeCount: number;

  /**
   * Ordered sequence of all tree origin paths.
   */
  readonly treeOrigins: readonly string[];
};

/**
 * Concrete transition path connecting a source tree to a destination tree.
 */
export type TTransition = {
  /**
   * Optional source coordinates where the transition reference originated.
   */
  readonly position?: TSourceLocation;

  /**
   * Sequence of file paths demonstrating the inter-tree connection.
   */
  readonly segment: readonly string[];
};
