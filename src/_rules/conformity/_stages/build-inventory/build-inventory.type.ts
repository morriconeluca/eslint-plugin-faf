import type { TFAFConfig } from '../../../../_src@shared/_types/faf-config.type.js';
import type { TOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEntryKind,
  TInventory,
} from '../../_conformity@shared/_types/verification-model.type.js';

/**
 * Pure inventory assembly result produced from scanned raw entries.
 */
export type TAssembledInventoryResult = {
  /**
   * Comprehensive inventory model indexing all discovered tree elements.
   */
  readonly inventory: TInventory;

  /**
   * Diagnostic outcomes collected during tree assembly and symlink detection.
   */
  readonly outcomes: readonly TOutcome[];
};

/**
 * Input arguments provided to the buildInventory pipeline stage.
 */
export type TBuildInventoryInput = {
  /**
   * Absolute directory hosting faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Validated configuration declaring external dependency targets and aliases.
   */
  readonly config: TFAFConfig;

  /**
   * Relative POSIX origin paths of all declared Fractal Trees.
   */
  readonly origins: readonly string[];

  /**
   * Optional POSIX paths of active in-memory file overlays relative to baseDirectory.
   */
  readonly overlayPaths?: readonly string[];
};

/**
 * Output payload produced when the buildInventory stage succeeds.
 */
export type TBuildInventoryValue = {
  /**
   * Inventory of declared tree origins and reached external files.
   */
  readonly inventory: TInventory;

  /**
   * Non-blocking outcomes discovered while building the inventory.
   */
  readonly inventoryOutcomes: readonly TOutcome[];
};

/**
 * Intermediate grouping of inventory nodes by roots and adjacency children lists.
 */
export type TGroupTreeNodesResult = {
  /**
   * Adjacency map associating parent directory paths with ordered lists of child paths.
   */
  readonly childrenMap: ReadonlyMap<string, readonly string[]>;

  /**
   * Array of tree origin root directory paths.
   */
  readonly roots: readonly string[];
};

/**
 * Representation of an inventory node being assembled during tree construction.
 */
export type TInProgressInventoryEntry = {
  /**
   * Whether the entry is a symbolic link.
   */
  readonly isSymlink: boolean;

  /**
   * Structural nature of the entry: folder container or regular leaf file.
   */
  readonly kind: TEntryKind;

  /**
   * Normalized POSIX path relative to the base configuration directory.
   */
  readonly path: string;

  /**
   * Real disk path relative to the base directory if internal, or canonical physical path if external.
   */
  readonly realPath: string;

  /**
   * Tree origin root path that contains this entry.
   */
  readonly treeOrigin: string;
};
