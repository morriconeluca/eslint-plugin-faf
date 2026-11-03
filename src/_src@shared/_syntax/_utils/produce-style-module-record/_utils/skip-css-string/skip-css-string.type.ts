/**
 * Result of attempting to skip a string literal at current scanner position.
 */
export type TSkipStringResult = {
  /**
   * Next character index after skipping string literal if matched.
   */
  readonly nextIndex: number;

  /**
   * Whether a string literal was encountered and skipped.
   */
  readonly skipped: boolean;
};
