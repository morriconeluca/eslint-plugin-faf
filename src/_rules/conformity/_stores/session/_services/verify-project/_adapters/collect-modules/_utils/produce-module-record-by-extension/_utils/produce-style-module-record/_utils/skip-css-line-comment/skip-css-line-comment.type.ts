/**
 * Result of attempting to skip a single-line comment at current scanner position.
 */
export type TSkipLineCommentResult = {
  /**
   * Next character index after skipping single-line comment if matched.
   */
  readonly nextIndex: number;

  /**
   * Whether a single-line comment was encountered and skipped.
   */
  readonly skipped: boolean;
};
