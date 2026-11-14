import type {
  TOutcome,
  TSourceLocation,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventory } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * One outcome projected onto the single file ESLint can report.
 */
export type TAnchoredOutcome = {
  /**
   * Absolute path of the lintable file that reports the outcome.
   */
  readonly anchorPath: string;

  /**
   * Original diagnostic produced by a verification stage.
   */
  readonly outcome: TOutcome;

  /**
   * Position taken from the outcome, or the start of the anchor file.
   */
  readonly position: TSourceLocation;
};

/**
 * Inputs of the deterministic anchoring projection.
 */
export type TAnchorOutcomesInput = {
  /**
   * Absolute directory that hosts faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Absolute path of faf.config.ts.
   */
  readonly configPath: string;

  /**
   * Inventory used to locate elements, absent when listing did not run.
   */
  readonly inventory?: TInventory;

  /**
   * Taxonomy model used to prefer a Fragment Master, absent before classification.
   */
  readonly model?: TTaxonomyModel;

  /**
   * Outcomes produced by the stages that ran.
   */
  readonly outcomes: readonly TOutcome[];
};

/**
 * Outcomes ordered stably and indexed by absolute anchor path.
 */
export type TAnchorOutcomesResult = {
  /**
   * Outcomes grouped by anchor path, preserving the stable order.
   */
  readonly byFile: ReadonlyMap<string, readonly TAnchoredOutcome[]>;

  /**
   * Anchored outcomes in stable order.
   */
  readonly outcomes: readonly TAnchoredOutcome[];
};
