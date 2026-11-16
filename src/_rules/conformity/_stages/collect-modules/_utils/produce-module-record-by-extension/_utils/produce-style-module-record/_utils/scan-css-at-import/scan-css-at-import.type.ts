/**
 * Result of attempting to scan an @import declaration.
 */
export type TScanAtImportResult = {
  /**
   * Next zero-based character index after consuming the @import statement.
   */
  readonly nextIndex: number;

  /**
   * Extracted raw specifier content if @import was matched.
   */
  readonly raw?: string;
};
