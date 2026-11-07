import type { TSourceLocation } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Transition segment between trees.
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
