/**
 * Configuration for reading file fingerprints from specific files and tree origins.
 */
export type TReadFileFingerprintsInput = {
  /**
   * Absolute paths of fractal tree origin directories to recursively scan and fingerprint.
   */
  readonly treeOrigins?: readonly string[];

  /**
   * Absolute paths of specific files to fingerprint.
   */
  readonly watchedFiles?: readonly string[];
};
