import type { TOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TRawInventoryEntry } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Result of scanning an individual tree origin directory recursively.
 */
export type TScanTreeOriginResult = {
  /**
   * Discovered raw inventory entries within the tree origin.
   */
  readonly entries: readonly TRawInventoryEntry[];

  /**
   * Diagnostic outcomes collected while accessing or traversing the origin.
   */
  readonly outcomes: readonly TOutcome[];
};
