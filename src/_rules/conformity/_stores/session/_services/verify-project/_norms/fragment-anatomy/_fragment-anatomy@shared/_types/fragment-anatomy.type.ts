import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

/**
 * Single inspected fragment packaging its classification, direct logical children, and master rank.
 */
export type TFragmentInspection = {
  /**
   * Architectural classification record of the fragment directory.
   */
  readonly fragmentClassification: TItemClassification;

  /**
   * Verified direct logical child file classifications, sorted by POSIX path.
   */
  readonly logicalChildren: readonly TItemClassification[];

  /**
   * Architectural rank imposed on the fragment master node, or null if unranked.
   */
  readonly masterRank: null | number;
};
