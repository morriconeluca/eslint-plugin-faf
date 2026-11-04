/**
 * Overlay identity for the file currently being linted.
 */
export type TSourceOverlay = {
  /**
   * Stable key, empty when the source text matches the file on disk.
   */
  readonly key: string;

  /**
   * Source text that differs from disk, or null when the overlay is unnecessary.
   */
  readonly text: null | string;
};
