/**
 * File identifiers selected by foreign node pattern families.
 */
export type TCollectedForeignFamilies = {
  /**
   * Integer identifiers of files matched by at least one family pattern.
   */
  readonly nodeItemIds: ReadonlySet<number>;

  /**
   * POSIX paths of files matched by at least one family pattern.
   */
  readonly nodePaths: ReadonlySet<string>;
};
