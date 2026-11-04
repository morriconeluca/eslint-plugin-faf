/**
 * Result of selecting foreign domains and foreign nodes within a fractal tree.
 */
export type TForeignSelection = {
  /**
   * Set of integer item identifiers corresponding to foreign domain directories.
   */
  readonly foreignDomainItemIds: ReadonlySet<number>;

  /**
   * Set of normalized POSIX paths corresponding to foreign domain directories.
   */
  readonly foreignDomainPaths: ReadonlySet<string>;

  /**
   * Set of integer item identifiers corresponding to foreign node files.
   */
  readonly foreignNodeItemIds: ReadonlySet<number>;

  /**
   * Set of normalized POSIX paths corresponding to foreign node files.
   */
  readonly foreignNodePaths: ReadonlySet<string>;
};
