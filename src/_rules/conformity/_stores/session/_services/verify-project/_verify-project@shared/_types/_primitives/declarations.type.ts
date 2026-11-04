import type { TFAFHierarchy } from '../../../../../../../../../_src@shared/_types/faf-config.type.js';

/**
 * Configuration source from which path alias definitions were retrieved.
 */
export type TAliasSource = 'common.aliases' | 'package.json#imports';

/**
 * Complete catalog of roles, sub-graph roles, top rank, and lookup indices.
 */
export type TEffectiveCatalog = {
  /**
   * Map resolving category directory names to corresponding effective roles.
   */
  readonly categoryToRole: ReadonlyMap<string, TEffectiveRole>;

  /**
   * Map resolving file extensions to corresponding implicit effective roles.
   */
  readonly extensionToRole: ReadonlyMap<string, TEffectiveRole>;

  /**
   * Ordered sequence of all ordinary architectural roles in this tree.
   */
  readonly roles: readonly TEffectiveRole[];

  /**
   * Closed list of auxiliary sub-graph role names.
   */
  readonly subGraphRoles: readonly string[];

  /**
   * Highest rank value assigned to access nodes and sub-graph nodes.
   */
  readonly topRank: number;
};

/**
 * Fully composed, validated, and normalized declarations across all codebase trees.
 */
export type TEffectiveDeclarations = {
  /**
   * Acquired path alias definitions with their respective targets and sources.
   */
  readonly aliases: readonly TEffectivePathAlias[];

  /**
   * Directory hosting the fafconfig.ts file, anchoring relative paths.
   */
  readonly baseDirectory: string;

  /**
   * Individual fractal trees configured across the analyzed codebase.
   */
  readonly trees: readonly TEffectiveTree[];
};

/**
 * Foreign node pattern group bound to specific directory scopes.
 */
export type TEffectiveForeignFamily = {
  /**
   * Directory scopes where the associated pattern filters take effect.
   */
  readonly paths: readonly string[];

  /**
   * Pattern strings matching files to be excluded from architectural verification.
   */
  readonly patterns: readonly string[];
};

/**
 * Aggregate foreign node selections comprising discrete paths and glob families.
 */
export type TEffectiveForeignNodes = {
  /**
   * Pattern-based node families filtering files across specified tree scopes.
   */
  readonly families: readonly TEffectiveForeignFamily[];

  /**
   * Explicit file paths designated directly as foreign nodes.
   */
  readonly individualPaths: readonly string[];
};

/**
 * Local horizontal hierarchy applied to specific parent directory paths.
 */
export type TEffectiveLocalHierarchy = {
  /**
   * Tiered descending rank tiers where each tier lists allowed child names.
   */
  readonly hierarchy: TFAFHierarchy;

  /**
   * Explicit parent folder locations governed by this ordering structure.
   */
  readonly paths: readonly string[];
};

/**
 * Category of fragments designated as an external address space mirror.
 */
export type TEffectiveMimeticStructure = {
  /**
   * Permitted action prefixes for path fragments, or null if unconfigured.
   */
  readonly actions: null | readonly string[];

  /**
   * Folder locations where mimetic path fragment rules apply.
   */
  readonly paths: readonly string[];
};

/**
 * Directed dependency pair connecting a source element path to a target path.
 */
export type TEffectiveOrientedPair = {
  /**
   * Source element or file path initiating the directed dependency authorization.
   */
  readonly from: string;

  /**
   * Target element or file path receiving the authorized directed dependency.
   */
  readonly to: string;
};

/**
 * Resolved path alias mapping a prefix pattern to alternative base destinations.
 */
export type TEffectivePathAlias = {
  /**
   * Alias prefix matching import specifiers at segment boundaries.
   */
  readonly prefix: string;

  /**
   * Originating source configuration declaring this alias definition.
   */
  readonly source: TAliasSource;

  /**
   * Ordered sequence of target directory alternatives mapped by this prefix.
   */
  readonly targets: readonly string[];
};

/**
 * Validated and normalized role contract containing assigned positional rank.
 */
export type TEffectiveRole = {
  /**
   * Flag permitting multiple root-scope symbols in matching logical nodes.
   */
  readonly allowMultipleSymbols: boolean;

  /**
   * Organizational folder name associated with this role.
   */
  readonly category: string;

  /**
   * Mandatory unit structure: category nodes or fragment boundaries.
   */
  readonly form: TRoleForm;

  /**
   * Dot-prefixed asset file extensions matching this role implicitly.
   */
  readonly implicitExtensions: readonly string[];

  /**
   * Canonical semantic designation assigned to the architectural role.
   */
  readonly name: string;

  /**
   * Positional order index governing strictly descending dependencies.
   */
  readonly rank: number;
};

/**
 * Resolved root fragment boundary containing root nodes and child sub-boundaries.
 */
export type TEffectiveRootFragment = {
  /**
   * Directed dependency pairs authorized towards root nodes in other boundaries.
   */
  readonly dependencyPairs: readonly TEffectiveOrientedPair[];

  /**
   * POSIX path identifying the boundary directory relative to configuration root.
   */
  readonly path: string;

  /**
   * Direct root node files enumerated within this boundary with assigned ranks.
   */
  readonly rootNodes: readonly TEffectiveRootNode[];

  /**
   * Nested direct descendant root fragments belonging to the same tree.
   */
  readonly subRootFragments: readonly TEffectiveRootFragment[];
};

/**
 * Root node file declared with its assigned positional rank index.
 */
export type TEffectiveRootNode = {
  /**
   * Direct file name of the root node within its root fragment directory.
   */
  readonly name: string;

  /**
   * Positional rank value governing permissible dependencies among root nodes.
   */
  readonly rank: number;
};

/**
 * Complete normalized and effective architectural specification for a fractal tree.
 */
export type TEffectiveTree = {
  /**
   * Effective role catalog and positional rank definitions for this tree.
   */
  readonly catalog: TEffectiveCatalog;

  /**
   * Authorized egress dependency pairs connecting internal nodes to external files.
   */
  readonly externalDependencyPairs: readonly TEffectiveOrientedPair[];

  /**
   * Folder locations designated as foreign domains within this tree.
   */
  readonly foreignDomains: readonly string[];

  /**
   * Discrete foreign files and pattern matching rules for non-architectural assets.
   */
  readonly foreignNodes: TEffectiveForeignNodes;

  /**
   * General descending rank tiers applied to matching sibling organizational folders.
   */
  readonly horizontalHierarchies: readonly TFAFHierarchy[];

  /**
   * Local hierarchy definitions bound to explicit folder locations in this tree.
   */
  readonly localHorizontalHierarchies: readonly TEffectiveLocalHierarchy[];

  /**
   * Designated organizational folders mirroring external HTTP or command structures.
   */
  readonly mimeticPathStructures: readonly TEffectiveMimeticStructure[];

  /**
   * Structural nature of the tree origin: root-fragment or root-layer.
   */
  readonly originKind: TOriginKind;

  /**
   * Relative POSIX path identifying the root directory of this fractal tree.
   */
  readonly originPath: string;

  /**
   * Exposed entry files accessible to external consumers across tree boundaries.
   */
  readonly publicRootNodes: readonly string[];

  /**
   * Hierarchical root fragments comprising the entry boundary of this tree.
   */
  readonly rootFragments: readonly TEffectiveRootFragment[];

  /**
   * Authorized unidirectional dependency pairs linking this tree to other trees.
   */
  readonly treeDependencyPairs: readonly TEffectiveOrientedPair[];
};

/**
 * Architectural origin category identifying whether a tree starts as layer or fragment.
 */
export type TOriginKind = 'root-fragment' | 'root-layer';

/**
 * Structural classification mode imposed on units belonging to an architectural role.
 */
export type TRoleForm = 'category-nodes' | 'fragments';
