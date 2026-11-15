/**
 * Result of attempting to skip a block comment at current scanner position.
 */
export type TSkipBlockCommentResult = {
  /**
   * Next character index after skipping block comment if matched.
   */
  readonly nextIndex: number;

  /**
   * Whether a block comment was encountered and skipped.
   */
  readonly skipped: boolean;
};
