import type {
  TFAFHorizontalHierarchy,
  TFAFHorizontalHierarchyModel,
} from '../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TOutcome,
  TSourceLocation,
  TUnverifiedOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';

/**
 * Configuration source from which path alias definitions were retrieved.
 */
export type TAliasSource = 'common.aliases' | 'package.json#imports';

/**
 * Compact CSR dependency graph of resolved edges between codebase files.
 */
export type TDependencyGraph = {
  /**
   * Destination vertex indices stored in contiguous CSR format.
   */
  readonly columnTargets: Int32Array;

  /**
   * Total count of directed dependency edges stored in the graph.
   */
  readonly edgeCount: number;

  /**
   * Parallel array of local-edge metadata aligned with CSR column targets.
   */
  readonly edgeMetadata: readonly TEdgeMetadata[];

  /**
   * Edge indices into columnTargets and edgeMetadata for each source file.
   */
  readonly edgesBySourcePath: ReadonlyMap<string, readonly number[]>;

  /**
   * Import arcs toward external libraries, which are not local-graph vertices.
   */
  readonly libraryNotes: readonly TLibraryNote[];

  /**
   * Library-note indices for each source file that imports an external library.
   */
  readonly libraryNotesBySourcePath: ReadonlyMap<string, readonly number[]>;

  /**
   * Map translating relative POSIX file paths to integer vertex indices.
   */
  readonly pathToVertex: ReadonlyMap<string, number>;

  /**
   * Offset indices into columnTargets for each vertex in compressed sparse row format.
   */
  readonly rowOffsets: Int32Array;

  /**
   * Total count of indexed vertices represented in the dependency graph.
   */
  readonly vertexCount: number;

  /**
   * Nature of each vertex, aligned with vertexToPath.
   */
  readonly vertexNatures: readonly TVertexNature[];

  /**
   * Array translating integer vertex indices back to relative POSIX file paths.
   */
  readonly vertexToPath: readonly string[];
};

/**
 * Structural metadata associated with one directed edge between local files.
 */
export type TEdgeMetadata = {
  /**
   * Alternative base paths of the path alias matched by the specifier.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Path alias prefix matched by the specifier, or null when none was used.
   */
  readonly aliasUsed: null | string;

  /**
   * Relative POSIX path of the resolved local destination file.
   */
  readonly destinationPath: string;

  /**
   * Zero-based import index within the source module record.
   */
  readonly importIndex: number;

  /**
   * Flag indicating whether this edge represents a type-only dependency.
   */
  readonly isTypeOnly: boolean;

  /**
   * Source coordinates where the import reference originated.
   */
  readonly position: TSourceLocation;

  /**
   * Relative POSIX path of the file that contains the import.
   */
  readonly sourcePath: string;

  /**
   * Verbatim module specifier written by the source file.
   */
  readonly specifier: string;

  /**
   * Syntactic form of the import or re-export that produced the edge.
   */
  readonly syntaxKind: TImportSyntaxKind;
};

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
   * Directory hosting the faf.config.ts file, anchoring relative paths.
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
 * Horizontal Hierarchy established for a single parent Logical Domain applied to a specific parent directory path.
 */
export type TEffectiveHorizontalHierarchy = {
  /**
   * Tiered descending rank tiers where each tier lists allowed direct child names.
   */
  readonly hierarchy: TFAFHorizontalHierarchy['hierarchy'];

  /**
   * Explicit parent folder location governed by this ordering structure.
   */
  readonly path: string;
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
   * Horizontal Hierarchies established for a single parent Logical Domain bound to explicit folder locations in this tree.
   */
  readonly horizontalHierarchies: readonly TEffectiveHorizontalHierarchy[];

  /**
   * Tree-wide Horizontal Hierarchy models applied to matching sibling Sub-Categories.
   */
  readonly horizontalHierarchyModels: readonly TFAFHorizontalHierarchyModel[];

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
 * Physical file system entity discriminator: directory or regular file.
 */
export type TEntryKind = 'directory' | 'file';

/**
 * Originating provenance of an exported symbol binding.
 */
export type TExportOrigin =
  | {
      /**
       * Identifier name of the locally declared symbol being exported.
       */
      readonly symbolName: string;

      /**
       * Provenance discriminant for locally declared root-scope symbols.
       */
      readonly type: 'local-symbol';
    }
  | {
      /**
       * Module specifier string from which all symbols are re-exported.
       */
      readonly specifier: string;

      /**
       * Provenance discriminant for wildcard export-all statements.
       */
      readonly type: 'export-all';
    }
  | {
      /**
       * Module specifier string providing the entire imported namespace object.
       */
      readonly specifier: string;

      /**
       * Provenance discriminant for re-exported namespace objects.
       */
      readonly type: 'namespace';
    }
  | {
      /**
       * Name of the binding as originally exported from the foreign module.
       */
      readonly importedName: string;

      /**
       * Module specifier string providing the imported binding.
       */
      readonly specifier: string;

      /**
       * Provenance discriminant for explicitly imported foreign bindings.
       */
      readonly type: 'imported-binding';
    };

/**
 * Observed crossing from a source tree node through external local files to a destination tree node.
 */
export type TExternalCrossing = {
  /**
   * Complete sequence of relative POSIX file paths from source to destination.
   */
  readonly chain: readonly string[];

  /**
   * Relative POSIX path of the resolved destination tree node.
   */
  readonly destinationPath: string;

  /**
   * Zero-based index of the initial crossing import in the source module record.
   */
  readonly importIndex: number;

  /**
   * Source coordinates where the initial crossing import reference originated.
   */
  readonly position: TSourceLocation;

  /**
   * Relative POSIX path of the source tree node initiating the crossing.
   */
  readonly sourcePath: string;

  /**
   * Verbatim module specifier written by the source tree node for the initial crossing edge.
   */
  readonly specifier: string;
};

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
   * Declaration source: horizontal hierarchy on a single parent, fragment internal roles, horizontal hierarchy model, or root-node tiers.
   */
  readonly origin:
    | 'fragment-internal'
    | 'horizontal-hierarchy'
    | 'horizontal-hierarchy-model'
    | 'root-nodes';

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
 * Resolution record produced for an individual module import reference.
 */
export type TImportResolution = {
  /**
   * All alternative target paths evaluated for the matched path alias.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Path alias prefix matched during resolution, or null if direct path used.
   */
  readonly aliasUsed: null | string;

  /**
   * Zero-based index of the import statement within the source module record.
   */
  readonly importIndex: number;

  /**
   * Relative POSIX path of the source file containing the import.
   */
  readonly sourcePath: string;

  /**
   * Resolved target destination or failure justification.
   */
  readonly target: TResolvedTarget;
};

/**
 * Concrete syntax form utilized by an import or re-export declaration.
 */
export type TImportSyntaxKind =
  | 'css-at-import'
  | 'css-url'
  | 'default-import'
  | 'export-all-from'
  | 'export-named-from'
  | 'export-type-from'
  | 'literal-dynamic-import'
  | 'mixed-type-specifier-import'
  | 'named-import'
  | 'namespace-import'
  | 'non-literal-dynamic-import'
  | 'require-call'
  | 'side-effect-import'
  | 'type-only-import'
  | 'typescript-import-type'
  | 'typescript-require-import';

/**
 * Comprehensive inventory model indexing all discovered codebase elements.
 */
export type TInventory = {
  /**
   * Ordered sequence of all indexed inventory items indexed by their integer ID.
   */
  readonly items: readonly TInventoryItem[];

  /**
   * Map translating normalized relative POSIX paths to integer item identifiers.
   */
  readonly pathToId: ReadonlyMap<string, number>;

  /**
   * Map translating canonical disk realpaths to integer item identifiers.
   */
  readonly realPathToId: ReadonlyMap<string, number>;
};

/**
 * Processed inventory node equipped with tree topology and traversal metadata.
 */
export type TInventoryItem = {
  /**
   * Distance in hierarchy levels from the inventory root directory.
   */
  readonly depth: number;

  /**
   * Unique integer identifier representing this item in compact graph structures.
   */
  readonly id: number;

  /**
   * Flag indicating whether this item resolves through a symbolic link.
   */
  readonly isSymlink: boolean;

  /**
   * Structural nature of the entry: folder container or regular leaf file.
   */
  readonly kind: TEntryKind;

  /**
   * Identifier of the direct parent directory item, or null for root entries.
   */
  readonly parentId: null | number;

  /**
   * Normalized POSIX path relative to the configuration directory.
   */
  readonly path: string;

  /**
   * Upper bound index of the preorder interval used for O(1) containment checks.
   */
  readonly preorderEnd: number;

  /**
   * Lower bound index of the preorder interval used for O(1) containment checks.
   */
  readonly preorderStart: number;

  /**
   * Canonical real path on disk used to disambiguate symbolic link aliases.
   */
  readonly realPath: string;

  /**
   * Root path of the enclosing fractal tree, or null if outside all trees.
   */
  readonly treeOrigin: null | string;
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
   * Role name imposed by enclosing parent category, or null if none is imposed.
   */
  readonly imposedRoleName: null | string;

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
 * Syntactic source language classification determining parsing strategy.
 */
export type TLanguageKind = 'binary' | 'script' | 'style';

/**
 * Import arc toward an external library, retained without a local vertex.
 */
export type TLibraryNote = {
  /**
   * Alternative base paths of the path alias matched by the specifier.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Path alias prefix matched by the specifier, or null when none was used.
   */
  readonly aliasUsed: null | string;

  /**
   * Zero-based import index within the source module record.
   */
  readonly importIndex: number;

  /**
   * Flag indicating whether the library import is type-only.
   */
  readonly isTypeOnly: boolean;

  /**
   * External package or built-in module name recorded for this import arc.
   */
  readonly packageName: string;

  /**
   * Source coordinates where the library import originated.
   */
  readonly position: TSourceLocation;

  /**
   * Relative POSIX path of the file that contains the import.
   */
  readonly sourcePath: string;

  /**
   * Verbatim module specifier written by the source file.
   */
  readonly specifier: string;

  /**
   * Syntactic form of the import that refers to the external library.
   */
  readonly syntaxKind: TImportSyntaxKind;
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
 * Module Records, resolutions, and unverified outcomes collected for the project.
 */
export type TModuleCollection = {
  /**
   * Module Records keyed by POSIX path relative to the configuration directory.
   */
  readonly records: ReadonlyMap<string, TModuleRecord>;

  /**
   * Import resolutions keyed by source path, in Module Record import order.
   */
  readonly resolutions: ReadonlyMap<string, readonly TImportResolution[]>;

  /**
   * Unverified outcomes for files and imports that could not be analyzed.
   */
  readonly unverifiedOutcomes: readonly TUnverifiedOutcome[];
};

/**
 * Export declaration describing public interface name, type status, and origin.
 */
export type TModuleExport = {
  /**
   * Public name through which consumers access the exported entity.
   */
  readonly exportedName: string;

  /**
   * Flag indicating whether the export exposes exclusively a type declaration.
   */
  readonly isTypeOnly: boolean;

  /**
   * Concrete origin provenance determining where the exported symbol originates.
   */
  readonly origin: TExportOrigin;

  /**
   * Source coordinates locating the export statement in source text.
   */
  readonly position: TSourceLocation;
};

/**
 * Extracted module import reference identifying target specifier and syntax.
 */
export type TModuleImport = {
  /**
   * Flag indicating whether the import participates exclusively in type space.
   */
  readonly isTypeOnly: boolean;

  /**
   * Syntactic construct expressing the module dependency in source code.
   */
  readonly kind: TImportSyntaxKind;

  /**
   * Source coordinates where the import statement or specifier appears.
   */
  readonly position: TSourceLocation;

  /**
   * Verbatim module specifier string, or null if the import is non-literal.
   */
  readonly specifier: null | string;
};

/**
 * Extracted structural metadata capturing imports, symbols, and exports of a file.
 */
export type TModuleRecord = {
  /**
   * Public symbol exports exposed by the module to external consumers.
   */
  readonly exports: readonly TModuleExport[];

  /**
   * Static and dynamic import references originating from this file.
   */
  readonly imports: readonly TModuleImport[];

  /**
   * Source content kind: binary asset, JavaScript/TypeScript script, or stylesheet.
   */
  readonly language: TLanguageKind;

  /**
   * Declarations introduced into the module root scope counted under FAF §4.
   */
  readonly symbols: readonly TRootSymbol[];

  /**
   * Unsupported language constructs requiring unverified diagnostic emission.
   */
  readonly unsupportedSyntaxes: readonly TUnsupportedSyntax[];
};

/**
 * Pure parsing function transforming file path and source text into a module record.
 */
export type TModuleRecordProducer = (
  path: string,
  text: string
) => TModuleRecord;

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
 * Architectural origin category identifying whether a tree starts as layer or fragment.
 */
export type TOriginKind = 'root-fragment' | 'root-layer';

/**
 * Validated project preparation consumed by taxonomy, graph, and norm verification.
 */
export type TProjectBasis = {
  /**
   * Path aliases acquired for the project.
   */
  readonly aliases: readonly TEffectivePathAlias[];

  /**
   * Absolute directory that hosts faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Absolute path of faf.config.ts.
   */
  readonly configPath: string;

  /**
   * Effective declarations composed for every Fractal Tree.
   */
  readonly declarations: TEffectiveDeclarations;

  /**
   * Inventory of the declared tree origins and reached local files.
   */
  readonly inventory: TInventory;

  /**
   * Non-blocking outcomes discovered while building the inventory.
   */
  readonly inventoryOutcomes: readonly TOutcome[];

  /**
   * Discriminant of a validated project preparation ready for verification.
   */
  readonly kind: 'ready';

  /**
   * Absolute paths of local files loaded while evaluating faf.config.ts.
   */
  readonly loadedFiles: readonly string[];
};

/**
 * Public Surface of every Fractal Tree in the project.
 */
export type TPublicSurface = {
  /**
   * Exposed nodes grouped by Fractal Tree origin.
   */
  readonly trees: readonly TTreePublicSurface[];
};

/**
 * Raw file system entry discovered during recursive directory scanning.
 */
export type TRawInventoryEntry = {
  /**
   * Flag indicating whether the entry was reached through a symbolic link.
   */
  readonly isSymlink: boolean;

  /**
   * Discriminant distinguishing directories from regular files.
   */
  readonly kind: TEntryKind;

  /**
   * Relative POSIX path normalized from the project configuration root.
   */
  readonly path: string;

  /**
   * Canonical physical path resolved via realpath on the host file system.
   */
  readonly realPath: string;
};

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
 * Concrete target identified by the module resolution process.
 */
export type TResolvedTarget =
  | {
      /**
       * External npm package or built-in module name.
       */
      readonly packageName: string;

      /**
       * Target discriminant for external third-party dependencies.
       */
      readonly type: 'external-library';
    }
  | {
      /**
       * Relative POSIX path identifying the resolved local file.
       */
      readonly path: string;

      /**
       * Target discriminant for local codebase files.
       */
      readonly type: 'local-file';
    }
  | {
      /**
       * Technical explanation why module resolution failed.
       */
      readonly reason: string;

      /**
       * Target discriminant for unresolvable import references.
       */
      readonly type: 'unresolved';
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
 * Structural classification mode imposed on units belonging to an architectural role.
 */
export type TRoleForm = 'category-nodes' | 'fragments';

/**
 * Origin form through which a role was detected: explicit suffix, implicit extension, or absent.
 */
export type TRoleKind = 'absent' | 'explicit' | 'implicit';

/**
 * Root scope declaration representing an architectural symbol under FAF §4.
 */
export type TRootSymbol = {
  /**
   * Declared identifier name introduced into the module root scope.
   */
  readonly name: string;

  /**
   * Source coordinates locating the symbol identifier declaration.
   */
  readonly position: TSourceLocation;

  /**
   * Namespace domain occupied by the symbol: value space or type space.
   */
  readonly space: TSymbolSpace;
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

/**
 * Namespace domain defining whether a symbol represents a value or a type.
 */
export type TSymbolSpace = 'type' | 'value';

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

/**
 * Logical Nodes of one Fractal Tree that consumers outside that Tree may import.
 */
export type TTreePublicSurface = {
  /**
   * POSIX paths of the Logical Nodes that form this Tree's Public Surface.
   */
  readonly nodes: readonly string[];

  /**
   * POSIX path of the Fractal Tree origin.
   */
  readonly originPath: string;
};

/**
 * Syntactic construct exceeding static analysis capabilities of the linter.
 */
export type TUnsupportedSyntax = {
  /**
   * Technical explanation describing the unanalyzable syntax construct.
   */
  readonly description: string;

  /**
   * Source coordinates where the unsupported syntax construct appears.
   */
  readonly position: TSourceLocation;
};

/**
 * Project model passed to every norm. Stages fill it; norms do not depend on each other.
 */
export type TVerificationModel = {
  /**
   * Ready preparation of configuration, inventory, and acquired aliases.
   */
  readonly basis: TProjectBasis;

  /**
   * Observed crossings through external local files between tree nodes.
   */
  readonly crossings: readonly TExternalCrossing[];

  /**
   * Resolved dependency graph of the codebase.
   */
  readonly graph: TDependencyGraph;

  /**
   * Ranks of admitted sibling sets.
   */
  readonly hierarchies: THorizontalHierarchies;

  /**
   * Collected Module Records, resolutions, and unverified outcomes.
   */
  readonly modules: TModuleCollection;

  /**
   * Logical Nodes exposed by each Fractal Tree.
   */
  readonly surface: TPublicSurface;

  /**
   * Classification of every inventory item.
   */
  readonly taxonomy: TTaxonomyModel;
};

/**
 * Membership of a dependency-graph vertex in a Fractal Tree or outside every Tree.
 */
export type TVertexNature =
  | {
      /**
       * Discriminant for a file that belongs to no Fractal Tree.
       */
      readonly kind: 'external-local-file';
    }
  | {
      /**
       * Inventory identifier of the file inside its Fractal Tree.
       */
      readonly inventoryId: number;

      /**
       * Discriminant for a file that belongs to a Fractal Tree.
       */
      readonly kind: 'tree-node';
    };
