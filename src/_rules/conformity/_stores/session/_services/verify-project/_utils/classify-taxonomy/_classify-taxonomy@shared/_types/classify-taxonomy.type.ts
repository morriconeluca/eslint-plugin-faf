import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TLogicalDomainKind,
  TNodeKind,
  TRoleAttribution,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveCatalog,
  TEffectiveDeclarations,
  TOriginKind,
  TRoleForm,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TEntryKind,
  TInventory,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Draft of one inventory item before Parent Category marking and Master promotion.
 */
export type TClassificationDraft = {
  /**
   * Logical domain kind for a directory, or null when absent or not unique.
   */
  readonly domainKind: null | TLogicalDomainKind;

  /**
   * Physical entry kind copied from the inventory item.
   */
  readonly entryKind: TEntryKind;

  /**
   * Unit form propagated from the enclosing category, or null when none applies.
   */
  readonly form: null | TRoleForm;

  /**
   * Fragment-internal rank, or null when the item is outside that hierarchy.
   */
  readonly fragmentInternalRank: null | number;

  /**
   * Role imposed by the enclosing category, or null when no category imposes one.
   */
  readonly imposedRoleName: null | string;

  /**
   * Whether this directory is a Path Fragment of a mimetic structure.
   */
  readonly isPathFragment: boolean;

  /**
   * Whether this directory is a Private Category of a Fragment or Root Fragment.
   */
  readonly isPrivateCategory: boolean;

  /**
   * Whether this directory is a Sub-Fragment of another Fragment.
   */
  readonly isSubFragment: boolean;

  /**
   * Whether this directory is a Sub-Layer of another Layer.
   */
  readonly isSubLayer: boolean;

  /**
   * Inventory identifier of the classified item.
   */
  readonly itemId: number;

  /**
   * Logical or foreign node kind for a file, or null when absent or not unique.
   */
  readonly nodeKind: null | TNodeKind;

  /**
   * Path of the nearest enclosing Fragment, not the direct container when that container is organizational.
   */
  readonly parentFragmentPath: null | string;

  /**
   * POSIX path of the classified item.
   */
  readonly path: string;

  /**
   * Role attribution computed from the file name, forced absent for Root Nodes and Foreign Nodes.
   */
  readonly role: TRoleAttribution;
};

/**
 * Inputs required to classify every fractal tree in one inventory.
 */
export type TClassifyTaxonomyInput = {
  /**
   * Effective declarations already composed for each fractal tree.
   */
  readonly declarations: TEffectiveDeclarations;

  /**
   * Inventory of files and directories, including entries outside every tree.
   */
  readonly inventory: TInventory;
};

/**
 * Directory classification produced by one precedence step.
 */
export type TDirectoryClassification = {
  /**
   * Unique logical domain kind, or null when the directory is not classifiable.
   */
  readonly domainKind: null | TLogicalDomainKind;

  /**
   * Form imposed on classified units, or null when this directory imposes none.
   */
  readonly form: null | TRoleForm;

  /**
   * Role imposed on classified units, or null when this directory imposes none.
   */
  readonly imposedRoleName: null | string;

  /**
   * Whether direct children are classified inside a mimetic path structure.
   */
  readonly isMimeticContext: boolean;

  /**
   * Whether this directory is a Path Fragment.
   */
  readonly isPathFragment: boolean;

  /**
   * Whether this directory is a Private Category.
   */
  readonly isPrivateCategory: boolean;

  /**
   * Whether this directory is a Sub-Fragment.
   */
  readonly isSubFragment: boolean;

  /**
   * Whether this directory is a Sub-Layer.
   */
  readonly isSubLayer: boolean;

  /**
   * Nearest enclosing Fragment path for this directory itself.
   */
  readonly parentFragmentPath: null | string;
};

/**
 * Parent facts required to classify a direct child.
 */
export type TDirectoryParent = {
  /**
   * Classified domain kind of the parent directory, or null when unclassifiable.
   */
  readonly domainKind: null | TLogicalDomainKind;

  /**
   * Form imposed on units classified by the parent, or null when the parent imposes none.
   */
  readonly form: null | TRoleForm;

  /**
   * Role imposed by the parent category chain, or null when none is imposed.
   */
  readonly imposedRoleName: null | string;

  /**
   * Whether direct children are inside a declared mimetic path structure.
   */
  readonly isMimeticContext: boolean;

  /**
   * Nearest Fragment path enclosing the parent, or the parent path when the parent is a Fragment.
   */
  readonly parentFragmentPath: null | string;

  /**
   * POSIX path of the parent directory.
   */
  readonly path: string;
};

/**
 * File classification together with a Root Fragment declaration conflict, if any.
 */
export type TFileClassification = {
  /**
   * Root enumeration conflict, or null when the file designation is unique.
   */
  readonly conflict: null | TRootFileConflict;

  /**
   * Draft fields independent of inventory identity.
   */
  readonly fields: Pick<
    TClassificationDraft,
    | 'domainKind'
    | 'form'
    | 'fragmentInternalRank'
    | 'imposedRoleName'
    | 'isPathFragment'
    | 'isPrivateCategory'
    | 'isSubFragment'
    | 'isSubLayer'
    | 'nodeKind'
    | 'parentFragmentPath'
    | 'role'
  >;
};

/**
 * Function resolving a file Role from its name and the tree catalog.
 */
export type TGetRoleFromName = (
  fileName: string,
  catalog: TEffectiveCatalog
) => TRoleAttribution;

/**
 * Declaration conflict detected while classifying a file under a Root Fragment.
 */
export type TRootFileConflict =
  | 'contradictory-root-foreign'
  | 'unenumerated-root-file';

/**
 * Classifier product: taxonomy model plus configuration outcomes.
 */
export type TTaxonomyClassification = {
  /**
   * Classifications of items that belong to at least one fractal tree.
   */
  readonly model: TTaxonomyModel;

  /**
   * Configuration outcomes for incompatible or incomplete declarations.
   */
  readonly outcomes: readonly TConfigOutcome[];
};

/**
 * Declaration indexes and configuration outcomes prepared before a tree walk.
 */
export type TTreeBuild = {
  /**
   * Classification facts for one fractal tree.
   */
  readonly context: TTreeClassificationContext;

  /**
   * Property path of each unique mimetic Parent Category declaration.
   */
  readonly mimeticPropertyPaths: ReadonlyMap<string, string>;

  /**
   * Configuration outcomes discovered while indexing declarations.
   */
  readonly outcomes: readonly TConfigOutcome[];

  /**
   * Property path of each declared Root Fragment.
   */
  readonly rootFragmentPropertyPaths: ReadonlyMap<string, string>;

  /**
   * Property path of each enumerated Root Node.
   */
  readonly rootNodePropertyPaths: ReadonlyMap<string, string>;
};

/**
 * Closed set of declaration facts used while classifying one tree.
 */
export type TTreeClassificationContext = {
  /**
   * Effective catalog of the tree being classified.
   */
  readonly catalog: TEffectiveCatalog;

  /**
   * Directory paths classified as Foreign Domains, excluding an origin listed as one.
   */
  readonly foreignDomainPaths: ReadonlySet<string>;

  /**
   * File paths selected as Foreign Nodes by domain, individual path, or family.
   */
  readonly foreignNodePaths: ReadonlySet<string>;

  /**
   * Role resolver for file names.
   */
  readonly getRoleFromName: TGetRoleFromName;

  /**
   * Declared mimetic Parent Category paths that are not duplicated.
   */
  readonly mimeticPaths: ReadonlySet<string>;

  /**
   * Origin kind of the tree.
   */
  readonly originKind: TOriginKind;

  /**
   * Origin path of the tree.
   */
  readonly originPath: string;

  /**
   * Declared Root Fragment paths belonging to the tree.
   */
  readonly rootFragmentPaths: ReadonlySet<string>;

  /**
   * Full paths of enumerated Root Nodes.
   */
  readonly rootNodePaths: ReadonlySet<string>;
};
