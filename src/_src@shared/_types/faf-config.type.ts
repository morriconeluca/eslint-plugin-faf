/**
 * Common configuration declarations shared across all fractal trees.
 */
export type TFAFCommonConfig = TFAFSharedConfig & {
  /**
   * Map of path alias prefixes to base target directories within codebase.
   */
  readonly aliases?: Readonly<Record<string, string>>;

  /**
   * Root fragment origins must be declared exclusively in local configurations.
   */
  readonly rootFragments?: never;

  /**
   * Root layer origins must be declared exclusively in local configurations.
   */
  readonly rootLayers?: never;
};

/**
 * Root configuration object exported as default from fafconfig.ts.
 *
 * @example
 * import type { TFAFConfig } from '@morriconeluca/eslint-plugin-faf';
 *
 * export default {
 *   faf: {
 *     locals: [
 *       {
 *         rootLayers: ['src'],
 *       },
 *     ],
 *   },
 * } satisfies TFAFConfig;
 */
export type TFAFConfig = {
  /**
   * Architectural declarations governing fractal trees across the codebase.
   */
  readonly faf: {
    /**
     * Shared declarations inherited or overridden property-by-property in locals.
     *
     * @default {} Defaults to an empty shared configuration.
     */
    readonly common?: TFAFCommonConfig;

    /**
     * Architectural configurations for individual trees via designated origins.
     */
    readonly locals: TFAFNonEmptyArray<TFAFLocalConfig>;
  };
};

/**
 * Authorized egress dependency from internal logical nodes to external local modules.
 */
export type TFAFExternalDependency = {
  /**
   * POSIX paths of internal logical node files permitted to import external modules.
   */
  readonly from: TFAFNonEmptyArray<string>;

  /**
   * POSIX paths of modular local files residing outside all fractal trees.
   */
  readonly to: TFAFNonEmptyArray<string>;
};

/**
 * Family of foreign nodes matching path patterns within designated tree scopes.
 */
export type TFAFForeignNodeFamily = {
  /**
   * Directory scopes relative to configuration file where patterns apply.
   */
  readonly paths: TFAFNonEmptyArray<string>;

  /**
   * Case-sensitive file matching patterns applied within the designated paths.
   *
   * @example ['*.md']
   */
  readonly patterns: TFAFNonEmptyArray<string>;
};

/**
 * Tiered hierarchy where each non-empty group occupies the positional rank
 * matching its index starting from zero. Only strictly descending dependencies
 * are authorized. Duplicate names require validator rejection. The outer array
 * may be empty, but internal tiers must contain at least one item.
 */
export type TFAFHierarchy = readonly TFAFNonEmptyArray<string>[];

/**
 * Local configuration defining one or more fractal trees via root origins.
 */
export type TFAFLocalConfig = TFAFSharedConfig &
  (
    | {
        /**
         * Non-empty array of apical root fragment origins.
         */
        readonly rootFragments: TFAFNonEmptyArray<TFAFRootFragment>;
      }
    | {
        /**
         * Non-empty array of root layer origin paths.
         */
        readonly rootLayers: TFAFNonEmptyArray<string>;
      }
  ) & {
    /**
     * Path aliases must be declared exclusively in the common configuration.
     */
    readonly aliases?: never;

    /**
     * Apical root fragments originating distinct fractal trees.
     */
    readonly rootFragments?: readonly TFAFRootFragment[];

    /**
     * Origin directory paths designated as root layers for fractal trees.
     */
    readonly rootLayers?: readonly string[];
  };

/**
 * Local horizontal hierarchy applied exclusively to designated parent directories.
 */
export type TFAFLocalHorizontalHierarchy = {
  /**
   * Tiered ordering applied to direct children of designated parent directories.
   */
  readonly hierarchies: TFAFHierarchy;

  /**
   * Parent directory paths relative to configuration file where ordering applies.
   */
  readonly paths: TFAFNonEmptyArray<string>;
};

/**
 * Mimetic path structure mapping an external hierarchical address space.
 */
export type TFAFMimeticPathStructure = {
  /**
   * Closed catalog of action verbs recognized as prefixes in path fragments.
   */
  readonly actions?: TFAFNonEmptyArray<string>;

  /**
   * POSIX paths of parent categories hosting the mimetic path structure.
   */
  readonly paths: TFAFNonEmptyArray<string>;
};

/**
 * Non-empty readonly array containing at least one element of type T.
 */
export type TFAFNonEmptyArray<T> = readonly [T, ...T[]];

/**
 * Role definition for standard architectural responsibilities. The presence
 * of implicit extensions enforces category-nodes form and statically forbids
 * setting isCategoryNode to false.
 */
export type TFAFRole = {
  /**
   * Enables multiple symbols within logical nodes bearing this explicit role.
   * Never waives the master node uniqueness law or re-export prohibition.
   *
   * @default false
   */
  readonly allowMultipleSymbols?: boolean;

  /**
   * Exact category directory name, including the leading underscore.
   */
  readonly category: string;

  /**
   * File extensions with leading dot associated with this implicit role.
   *
   * @example ['.png', '.jpg', '.svg']
   */
  readonly implicitRoleExtensions?: TFAFNonEmptyArray<string>;

  /**
   * Indicates whether classified units are category nodes instead of fragments.
   */
  readonly isCategoryNode?: boolean;

  /**
   * Exact and unique name of the role within the catalog.
   */
  readonly name: string;
} & (
  | {
      /**
       * Implicit role extensions associated with this role.
       */
      readonly implicitRoleExtensions: TFAFNonEmptyArray<string>;

      /**
       * Category nodes form must be true when implicit extensions are provided.
       */
      readonly isCategoryNode?: true;
    }
  | {
      /**
       * Implicit role extensions must not be defined in this variant.
       */
      readonly implicitRoleExtensions?: never;
    }
);

/**
 * Ordered catalog of roles determining internal fragment node ranks.
 * Each entry is either a single role or a non-empty group of roles sharing rank.
 */
export type TFAFRoles = readonly (TFAFNonEmptyArray<TFAFRole> | TFAFRole)[];

/**
 * Authorization for directed dependencies between root nodes across root fragments.
 */
export type TFAFRootDependencyEdge = {
  /**
   * File names of source root nodes within the enclosing root fragment.
   */
  readonly from: TFAFNonEmptyArray<string>;

  /**
   * POSIX paths of target root nodes in other root fragments of the same tree.
   */
  readonly to: TFAFNonEmptyArray<string>;
};

/**
 * Boundary root fragment declaring root nodes, child root fragments, and edges.
 */
export type TFAFRootFragment = {
  /**
   * Inter-root-fragment authorizations towards root nodes in other root fragments.
   *
   * @default [] Defaults to an empty list.
   */
  readonly dependencyEdges?: readonly TFAFRootDependencyEdge[];

  /**
   * POSIX path of the root fragment directory relative to the config file.
   */
  readonly path: string;

  /**
   * Exhaustive enumeration of direct boundary files, arranged into tiered levels.
   */
  readonly rootNodes: TFAFHierarchy;

  /**
   * Directly nested descendant boundaries within the same tree.
   *
   * @default [] Defaults to an empty list.
   */
  readonly subRootFragments?: readonly TFAFRootFragment[];
};

/**
 * Declarations shareable between global common settings and local configurations.
 */
export type TFAFSharedConfig = {
  /**
   * Specific authorizations granting internal units permission to import external local modules.
   *
   * @default [] Defaults to an empty list.
   */
  readonly externalDependencies?: readonly TFAFExternalDependency[];

  /**
   * Folder locations excluded from the dependency graph and architecture rules.
   *
   * @default [] Defaults to an empty list.
   */
  readonly foreignDomains?: readonly string[];

  /**
   * Specific file paths or glob matching definitions excluded from architecture norms.
   *
   * @default [] Defaults to an empty list.
   */
  readonly foreignNodes?: readonly (string | TFAFForeignNodeFamily)[];

  /**
   * Default descending rank specifications applied across matching sibling directories.
   *
   * @default [] Defaults to an empty list.
   */
  readonly horizontalHierarchies?: readonly TFAFHierarchy[];

  /**
   * Targeted descending rank definitions bound to explicit folder locations.
   *
   * @default [] Defaults to an empty list.
   */
  readonly localHorizontalHierarchies?: readonly TFAFLocalHorizontalHierarchy[];

  /**
   * Designated organizational folders mirroring external HTTP or command address spaces.
   *
   * @default [] Defaults to an empty list.
   */
  readonly mimeticPathStructures?: readonly TFAFMimeticPathStructure[];

  /**
   * Exposed entry files accessible to external consumers across boundary frontiers.
   *
   * @default [] Defaults to an empty list.
   */
  readonly publicRootNodes?: readonly string[];

  /**
   * Ordered catalog of architectural roles and internal fragment hierarchies.
   */
  readonly roles?: TFAFRoles;

  /**
   * Specialized responsibilities reserved for entry files in test and auxiliary sub-graphs.
   *
   * @default [] Defaults to an empty list.
   */
  readonly subGraphRoles?: readonly TFAFSubGraphRole[];

  /**
   * Explicit unidirectional access grants between separate architectural trees.
   *
   * @default [] Defaults to an empty list.
   */
  readonly treeDependencies?: readonly TFAFTreeDependency[];
};

/**
 * Dedicated role reserved for entry points into isolated execution sub-graphs.
 */
export type TFAFSubGraphRole = {
  /**
   * Unique name of the sub-graph role, disjoint from standard roles.
   */
  readonly name: string;
};

/**
 * Authorized directed dependency relation between distinct fractal trees.
 */
export type TFAFTreeDependency = {
  /**
   * Origin paths of source fractal trees initiating the dependency.
   */
  readonly from: TFAFNonEmptyArray<string>;

  /**
   * Origin paths of target fractal trees exposing their public surface.
   */
  readonly to: TFAFNonEmptyArray<string>;
};
