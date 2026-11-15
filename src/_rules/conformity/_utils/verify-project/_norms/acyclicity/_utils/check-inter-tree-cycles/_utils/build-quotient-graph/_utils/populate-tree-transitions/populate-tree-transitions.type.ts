import type { TSourceLocation } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

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
