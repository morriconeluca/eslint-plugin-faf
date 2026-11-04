/**
 * Result of reading an unquoted url inside an @import statement.
 */
export type TReadUnquotedUrlResult = {
  /**
   * Next character index after closing parenthesis of url(...).
   */
  readonly nextIndex: number;

  /**
   * String content extracted from within unquoted url.
   */
  readonly raw: string;
};
