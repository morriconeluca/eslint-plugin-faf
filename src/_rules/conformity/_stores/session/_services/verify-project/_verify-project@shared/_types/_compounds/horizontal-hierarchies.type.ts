/**
 * Horizontal Hierarchies derived for the project.
 */
export type THorizontalHierarchies = {
  /**
   * Admitted sibling sets with a rank for each sibling.
   */
  readonly sets: readonly THorizontalHierarchySet[];
};

/**
 * One admitted set of direct siblings under a single parent.
 */
export type THorizontalHierarchySet = {
  /**
   * POSIX path of the parent whose direct children this set orders.
   */
  readonly parentPath: string;

  /**
   * Siblings belonging to this set. Sets under the same parent are disjoint.
   */
  readonly siblings: readonly TSiblingRank[];
};

/**
 * Natural rank of one sibling inside one admitted sibling set.
 */
export type TSiblingRank = {
  /**
   * Child name of the sibling Logical Domain or Logical Node.
   */
  readonly name: string;

  /**
   * Natural rank of the sibling. A higher rank may depend only on a lower rank of the same set.
   */
  readonly rank: number;
};
