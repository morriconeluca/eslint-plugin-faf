import type { TOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type { TRawInventoryEntry } from '../../../../../_inventory/_types/inventory.type.js';

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
