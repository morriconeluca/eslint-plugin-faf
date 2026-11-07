import type { TEffectiveRootFragment } from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

/**
 * Indexed graph of authorized dependency edges between root fragments.
 */
export type TRootAuthGraph = {
  /**
   * Adjacency list mapping root fragment index to target root fragment indices.
   */
  readonly adjacency: readonly (readonly number[])[];

  /**
   * Complete flat sequence of all effective root fragments across trees.
   */
  readonly allRootFragments: readonly TEffectiveRootFragment[];

  /**
   * Total number of indexed root fragments.
   */
  readonly fragCount: number;

  /**
   * Ordered sequence of all unique root fragment directory paths.
   */
  readonly fragmentPaths: readonly string[];

  /**
   * Lookup translating full root node file path to owning root fragment path.
   */
  readonly nodeToFragmentPath: ReadonlyMap<string, string>;
};
