import type { TInventoryItem } from '../../_types/_primitives/inventory.type.js';

/**
 * Comprehensive structural position of an import edge relative to the domain hierarchy.
 */
export type TEdgeGeometry = TInterTreeEdgeGeometry | TIntraTreeEdgeGeometry;

/**
 * Admissible identifier specifying a node within edge geometry analysis.
 */
export type TEdgeGeometryElement = number | string | TInventoryItem;

/**
 * Geometric relationships for an import edge between elements of different Fractal Trees.
 */
export type TInterTreeEdgeGeometry = {
  /**
   * Empty sequence because no tree-internal descent path exists between different trees.
   */
  readonly descendingDomains: readonly [];

  /**
   * Flag indicating whether the edge crosses different Fractal Trees.
   */
  readonly differentTrees: true;

  /**
   * Absent destination descent step for cross-tree edges.
   */
  readonly firstStepDestination: null;

  /**
   * Absent source descent step for cross-tree edges.
   */
  readonly firstStepSource: null;

  /**
   * Fast predicate verifying source containment, always false for foreign-tree domains.
   */
  readonly isSourceInside: (domain: TInventoryItem) => boolean;

  /**
   * Absent lowest common ancestor for elements belonging to distinct Fractal Trees.
   */
  readonly lowestCommonAncestor: null;

  /**
   * Flag indicating whether both edge endpoints reside within the same Fractal Tree.
   */
  readonly sameTree: false;
};

/**
 * Geometric relationships for an import edge connecting elements within the same Fractal Tree.
 */
export type TIntraTreeEdgeGeometry = {
  /**
   * Ordered sequence of directory domains entered while descending from LCA to destination.
   */
  readonly descendingDomains: readonly TInventoryItem[];

  /**
   * Flag indicating whether the edge crosses different Fractal Trees.
   */
  readonly differentTrees: false;

  /**
   * Child node or domain under LCA along the path to destination, or null if destination is LCA.
   */
  readonly firstStepDestination: null | TInventoryItem;

  /**
   * Child node or domain under LCA along the path to source, or null if source is LCA.
   */
  readonly firstStepSource: null | TInventoryItem;

  /**
   * Fast O(1) containment predicate verifying if source resides inside the specified domain.
   */
  readonly isSourceInside: (domain: TInventoryItem) => boolean;

  /**
   * Lowest common directory ancestor containing both source and destination elements.
   */
  readonly lowestCommonAncestor: TInventoryItem;

  /**
   * Flag indicating whether both edge endpoints reside within the same Fractal Tree.
   */
  readonly sameTree: true;
};
