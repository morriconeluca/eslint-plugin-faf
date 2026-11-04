/**
 * Result of reading an @import target specifier from source text.
 */
export type TReadAtImportSpecifierResult = {
  /**
   * Next character index after the specifier token.
   */
  readonly nextIndex: number;

  /**
   * Raw specifier content extracted from @import.
   */
  readonly raw: string;
};
