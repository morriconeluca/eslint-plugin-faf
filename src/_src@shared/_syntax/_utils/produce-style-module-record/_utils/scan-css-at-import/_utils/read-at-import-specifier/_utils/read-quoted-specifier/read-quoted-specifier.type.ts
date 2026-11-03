/**
 * Result of reading a quoted @import target specifier from source text.
 */
export type TReadQuotedSpecifierResult = {
  /**
   * Next character index after the closing quote if present.
   */
  readonly nextIndex: number;

  /**
   * Unescaped string content extracted from within quotes.
   */
  readonly raw: string;
};
