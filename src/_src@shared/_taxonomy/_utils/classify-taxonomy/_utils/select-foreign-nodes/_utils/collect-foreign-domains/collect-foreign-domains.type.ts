/**
 * Aggregate sets of collected foreign domain directories and descendant node files.
 */
export type TCollectedForeignDomains = {
  /**
   * Set of integer item identifiers for identified foreign domain folders.
   */
  readonly domainItemIds: ReadonlySet<number>;

  /**
   * Set of normalized POSIX paths for identified foreign domain folders.
   */
  readonly domainPaths: ReadonlySet<string>;

  /**
   * Set of integer item identifiers for descendant foreign node files.
   */
  readonly nodeItemIds: ReadonlySet<number>;

  /**
   * Set of normalized POSIX paths for descendant foreign node files.
   */
  readonly nodePaths: ReadonlySet<string>;
};
