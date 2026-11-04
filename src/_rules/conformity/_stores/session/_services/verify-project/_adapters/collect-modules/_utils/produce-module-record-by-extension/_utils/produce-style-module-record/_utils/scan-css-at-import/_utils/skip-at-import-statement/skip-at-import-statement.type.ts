/**
 * Result of skipping the trailing remainder of an @import statement.
 */
export type TSkipAtImportStatementResult = {
  /**
   * Next character index after the terminated @import statement.
   */
  readonly nextIndex: number;
};
