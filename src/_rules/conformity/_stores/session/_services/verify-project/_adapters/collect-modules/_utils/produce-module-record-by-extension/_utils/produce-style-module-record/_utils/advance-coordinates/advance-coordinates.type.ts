/**
 * Result of advancing line and column coordinates across a source text range.
 */
export type TAdvanceCoordinatesResult = {
  /**
   * One-based column number after consuming the text range.
   */
  readonly column: number;

  /**
   * One-based line number after consuming the text range.
   */
  readonly line: number;
};
