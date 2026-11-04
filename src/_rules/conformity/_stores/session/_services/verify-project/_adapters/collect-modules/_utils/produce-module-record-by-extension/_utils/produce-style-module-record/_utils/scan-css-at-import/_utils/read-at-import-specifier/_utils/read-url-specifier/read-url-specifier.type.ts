/**
 * Result of reading a url(...) specifier in an @import statement.
 */
export type TReadUrlSpecifierResult = {
  /**
   * Next character index after closing parenthesis of url(...).
   */
  readonly nextIndex: number;

  /**
   * String content extracted from within url(...) specifier.
   */
  readonly raw: string;
};
