import type {
  TOutcome,
  TSourceLocation,
} from '../../../../_conformity@shared/_types/outcome.type.js';

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
