/**
 * Result returned after scanning a CSS url(...) expression.
 */
export type TReadUrlSpecifierResult = {
  /**
   * Index immediately after the closing parenthesis of the url(...) expression.
   */
  readonly nextIndex: number;

  /**
   * Extracted raw specifier inside url(...), before normalization.
   */
  readonly raw: string;
};
