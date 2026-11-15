import type { TOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TRawInventoryEntry } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

/**
 * Result of evaluating a single directory entry during tree scanning.
 */
export type TProcessDirentResult = {
  /**
   * Absolute path of a discovered subdirectory that should be queued for traversal.
   */
  readonly directoryToVisit?: string;

  /**
   * Collected inventory entry if the item was successfully inspected.
   */
  readonly entry?: TRawInventoryEntry;

  /**
   * Diagnostic outcome generated if inspecting the entry failed.
   */
  readonly outcome?: TOutcome;
};
