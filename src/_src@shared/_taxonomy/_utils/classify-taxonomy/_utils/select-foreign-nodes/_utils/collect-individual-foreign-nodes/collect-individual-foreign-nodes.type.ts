/**
 * Result of resolving explicit individual foreign node paths to sets.
 */
export type TCollectedIndividualForeignNodes = {
  /**
   * Set of integer item identifiers for identified individual foreign node files.
   */
  readonly nodeItemIds: ReadonlySet<number>;

  /**
   * Set of normalized POSIX paths for identified individual foreign node files.
   */
  readonly nodePaths: ReadonlySet<string>;
};
