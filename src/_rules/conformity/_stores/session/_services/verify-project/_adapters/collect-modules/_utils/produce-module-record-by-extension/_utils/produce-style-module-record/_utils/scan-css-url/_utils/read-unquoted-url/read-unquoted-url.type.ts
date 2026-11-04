/**
 * Result of reading an unquoted url target from source text.
 */
export type TReadUnquotedUrlResult = {
  /**
   * Next character index after closing parenthesis of url(...).
   */
  readonly nextIndex: number;

  /**
   * String content extracted from within unquoted url function.
   */
  readonly raw: string;
};
