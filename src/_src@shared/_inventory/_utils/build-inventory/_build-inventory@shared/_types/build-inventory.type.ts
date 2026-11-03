import type { TOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type {
  TEntryKind,
  TInventory,
} from '../../../../_types/inventory.type.js';

/**
 * Result structure produced by the pure inventory assembly pipeline.
 */
export type TBuildInventoryResult = {
  /**
   * Comprehensive inventory model indexing all discovered codebase elements.
   */
  readonly inventory: TInventory;

  /**
   * Diagnostic outcomes collected during tree assembly and validation.
   */
  readonly outcomes: readonly TOutcome[];
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
