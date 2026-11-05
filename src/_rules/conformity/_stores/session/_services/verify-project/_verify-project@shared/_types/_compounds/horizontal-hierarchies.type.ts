/**
 * Horizontal Hierarchy applications and overlapping effective selections.
 */
export type THorizontalHierarchies = {
  /**
   * Items selected by more than one hierarchy, including invalid applications.
   */
  readonly conflicts: readonly THorizontalHierarchyConflict[];

  /**
   * Independently identified applications, including non-orderable sibling sets.
   */
  readonly sets: readonly THorizontalHierarchySet[];
};

/**
 * Effective overlap that a norm must reject rather than resolve by precedence.
 */
export type THorizontalHierarchyConflict = {
  /**
   * Distinct identities of the hierarchies selecting this item.
   */
  readonly hierarchyIds: readonly number[];

  /**
   * Inventory identity of the multiply selected child.
   */
  readonly itemId: number;
};

/**
 * One application to the direct children of one parent.
 */
export type THorizontalHierarchySet = {
  /**
   * Deterministic identity within this model; ranks compare only within this identity.
   */
  readonly id: number;

  /**
   * Whether the parent and selected children form an admitted homogeneous sibling set.
   */
  readonly isOrderable: boolean;

  /**
   * Declaration source, without precedence between general and local applications.
   */
  readonly origin: 'fragment-internal' | 'general' | 'local' | 'root-nodes';

  /**
   * POSIX path of the parent whose direct children are selected.
   */
  readonly parentPath: string;

  /**
   * Names repeated in this declaration, whether or not present in the inventory.
   */
  readonly repetitions: readonly string[];

  /**
   * Effective selections with original ranks; repeated selections remain observable.
   */
  readonly siblings: readonly TSiblingRank[];
};

/**
 * Rank of an inventory item within one specific hierarchy application.
 */
export type TSiblingRank = {
  /**
   * Inventory identity; classification and path remain in the taxonomy and inventory.
   */
  readonly itemId: number;

  /**
   * Original natural rank, never renumbered after absent names are removed.
   */
  readonly rank: number;
};
