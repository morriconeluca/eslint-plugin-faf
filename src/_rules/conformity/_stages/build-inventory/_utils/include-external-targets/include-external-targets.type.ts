/**
 * Resolved disk entry referenced as an external inventory target.
 */
export type TResolvedExternalTarget = {
  /**
   * Absolute file-system path to the resolved entry.
   */
  readonly absolute: string;

  /**
   * Structural nature of the resolved entry on disk.
   */
  readonly kind: 'directory' | 'file';

  /**
   * Normalized POSIX path relative to the configuration base directory.
   */
  readonly normalized: string;
};
