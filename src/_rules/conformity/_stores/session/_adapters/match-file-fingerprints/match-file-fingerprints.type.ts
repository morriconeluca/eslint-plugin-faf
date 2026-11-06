/**
 * Target paths and tree origins evaluated against stored fingerprints.
 */
export type TMatchFileFingerprintsInput = {
  /**
   * Absolute paths of fractal tree origin directories to verify.
   */
  readonly treeOrigins?: readonly string[];

  /**
   * Absolute paths of specific files to verify.
   */
  readonly watchedFiles?: readonly string[];
};
