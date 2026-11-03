/**
 * Result of reading a quoted url inside an @import statement.
 */
export type TReadQuotedUrlResult = {
  /**
   * Next character index after closing parenthesis of url(...).
   */
  readonly nextIndex: number;

  /**
   * Extracted string content within quotes.
   */
  readonly raw: string;
};
