/**
 * Result of reading a quoted url target from source text.
 */
export type TReadQuotedUrlResult = {
  /**
   * Next character index after closing parenthesis of url(...).
   */
  readonly nextIndex: number;

  /**
   * Unescaped string content extracted from within quotes.
   */
  readonly raw: string;
};
