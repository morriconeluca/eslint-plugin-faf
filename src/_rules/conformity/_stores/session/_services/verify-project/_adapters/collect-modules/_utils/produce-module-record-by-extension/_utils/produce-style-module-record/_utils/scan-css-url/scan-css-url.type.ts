/**
 * Result of attempting to scan a url(...) function reference.
 */
export type TScanUrlResult = {
  /**
   * Next zero-based character index after scanning url(...) reference.
   */
  readonly nextIndex: number;

  /**
   * Extracted raw specifier content inside url(...) if matched.
   */
  readonly raw?: string;
};
