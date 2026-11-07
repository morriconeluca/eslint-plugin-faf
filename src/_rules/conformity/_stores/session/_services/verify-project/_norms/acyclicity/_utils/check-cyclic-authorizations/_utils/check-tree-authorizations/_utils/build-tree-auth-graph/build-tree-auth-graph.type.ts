/**
 * Indexed tree authorization graph.
 */
export type TTreeAuthGraph = {
  /**
   * Adjacency list mapping tree index to adjacent tree indices.
   */
  readonly adjacency: readonly (readonly number[])[];

  /**
   * Lookup translating tree origin path to unique integer tree index.
   */
  readonly originToIndex: ReadonlyMap<string, number>;

  /**
   * Ordered sequence of all tree origin paths.
   */
  readonly sortedOrigins: readonly string[];

  /**
   * Total number of indexed trees.
   */
  readonly treeCount: number;
};
