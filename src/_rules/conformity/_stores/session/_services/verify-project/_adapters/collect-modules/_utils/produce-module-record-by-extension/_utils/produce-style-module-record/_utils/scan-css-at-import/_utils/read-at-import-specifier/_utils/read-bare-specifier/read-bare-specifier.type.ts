/**
 * Result of reading an unquoted bare or interpolated @import specifier.
 */
export type TReadBareSpecifierResult = {
  /**
   * Next character index after the bare specifier.
   */
  readonly nextIndex: number;

  /**
   * String content of the bare specifier.
   */
  readonly raw: string;
};
