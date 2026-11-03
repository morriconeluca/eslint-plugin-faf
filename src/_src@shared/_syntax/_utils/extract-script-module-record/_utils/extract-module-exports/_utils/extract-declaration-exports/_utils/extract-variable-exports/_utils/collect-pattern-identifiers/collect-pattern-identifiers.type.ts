/**
 * Extracted identifier name and character offset from a pattern.
 */
export type TPatternIdentifier = {
  /**
   * Name of the identifier token.
   */
  readonly name: string;

  /**
   * Character offset in the source text where the identifier starts.
   */
  readonly start: number;
};
