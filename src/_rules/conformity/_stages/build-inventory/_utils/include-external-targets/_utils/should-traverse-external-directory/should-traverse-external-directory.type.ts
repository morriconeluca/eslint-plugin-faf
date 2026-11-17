/**
 * Input parameters determining whether an external candidate directory should be traversed.
 */
export type TExternalDirectoryCheck = {
  /**
   * Normalized POSIX paths of declared Fractal Tree origins.
   */
  readonly declaredOrigins: ReadonlySet<string>;

  /**
   * Whether the directory is a direct child of the configuration base directory.
   */
  readonly isAtRoot: boolean;

  /**
   * Basename of the directory entry.
   */
  readonly name: string;

  /**
   * POSIX path of the directory relative to the configuration base directory.
   */
  readonly relativePath: string;
};
