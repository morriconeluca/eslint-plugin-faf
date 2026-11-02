import type { TEntryKind } from '../../_inventory/_types/inventory.type.js';

/**
 * Membership and positional rank within a designated horizontal hierarchy.
 */
export type THierarchyPlacement = {
  /**
   * Unique identifier of the horizontal hierarchy governing this placement.
   */
  readonly hierarchyId: string;

  /**
   * Assigned positional rank index within the specified horizontal hierarchy.
   */
  readonly rank: number;
};

/**
 * Complete architectural classification record computed for an inventory item.
 */
export type TItemClassification = {
  /**
   * Logical domain classification if the item represents a directory, or null.
   */
  readonly domainKind: null | TLogicalDomainKind;

  /**
   * Structural nature of the underlying physical file system entry.
   */
  readonly entryKind: TEntryKind;

  /**
   * Positional rank inside the owning fragment node hierarchy, or null.
   */
  readonly fragmentInternalRank: null | number;

  /**
   * Horizontal hierarchy placement governing peer dependency authorizations, or null if unplaced.
   */
  readonly hierarchyPlacement: null | THierarchyPlacement;

  /**
   * Role name imposed by enclosing parent category, or null if none is imposed.
   */
  readonly imposedRoleName: null | string;

  /**
   * Flag indicating whether this node belongs to the tree public surface.
   */
  readonly isPublicSurface: boolean;

  /**
   * Corresponding integer identifier matching the inventory item.
   */
  readonly itemId: number;

  /**
   * Logical node classification if the item represents a file, or null.
   */
  readonly nodeKind: null | TNodeKind;

  /**
   * Relative POSIX path identifying the classified item within the workspace.
   */
  readonly path: string;

  /**
   * Contextual relational attributes derived from enclosing structural topology.
   */
  readonly relationalQualifications: TRelationalQualifications;

  /**
   * Architectural role evaluated from file nomenclature and implicit rules.
   */
  readonly role: TRoleAttribution;
};

/**
 * Functional or organizational architectural category assigned to directory domains.
 */
export type TLogicalDomainKind =
  | 'category'
  | 'foreign-domain'
  | 'fractal-branch'
  | 'fragment'
  | 'layer'
  | 'path-sub-category'
  | 'root-fragment'
  | 'root-layer'
  | 'sub-category';

/**
 * Architectural node qualification assigned to individual files under FAF taxonomy.
 */
export type TNodeKind =
  | 'access-node'
  | 'category-node'
  | 'foreign-node'
  | 'fragment-node'
  | 'master-node'
  | 'root-node'
  | 'sub-graph-node'
  | 'unauthorized-logical-node';

/**
 * Calculated relational qualities derived from container hierarchy and context.
 */
export type TRelationalQualifications = {
  /**
   * Indicates whether this category serves as origin for a mimetic or sub-category chain.
   */
  readonly isParentCategory: boolean;

  /**
   * Indicates whether this fragment represents an endpoint in a mimetic path structure.
   */
  readonly isPathFragment: boolean;

  /**
   * Indicates whether this category is directly owned by a fragment or root fragment.
   */
  readonly isPrivateCategory: boolean;

  /**
   * Indicates whether this fragment is encapsulated within an ancestor parent fragment.
   */
  readonly isSubFragment: boolean;

  /**
   * Indicates whether this layer is nested directly under another layer container.
   */
  readonly isSubLayer: boolean;

  /**
   * POSIX path of enclosing parent fragment, or null if this is a top-level unit.
   */
  readonly parentFragmentPath: null | string;
};

/**
 * Concrete role qualification evaluated from file naming and implicit extensions.
 */
export type TRoleAttribution = {
  /**
   * Structural nature of role attribution: explicit suffix, implicit asset, or absent.
   */
  readonly kind: TRoleKind;

  /**
   * Name of the resolved architectural role, or null if no role applies.
   */
  readonly roleName: null | string;
};

/**
 * Origin form through which a role was detected: explicit suffix, implicit extension, or absent.
 */
export type TRoleKind = 'absent' | 'explicit' | 'implicit';

/**
 * Complete taxonomy model mapping all inventory items to architectural classifications.
 */
export type TTaxonomyModel = {
  /**
   * Lookup index mapping integer item identifiers to classification records.
   */
  readonly byItemId: ReadonlyMap<number, TItemClassification>;

  /**
   * Lookup index mapping relative POSIX paths to classification records.
   */
  readonly byPath: ReadonlyMap<string, TItemClassification>;

  /**
   * Sequential array of all item classifications matching inventory order.
   */
  readonly classifications: readonly TItemClassification[];
};
