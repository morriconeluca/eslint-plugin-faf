/**
 * Physical file system entity discriminator: directory or regular file.
 */
export type TEntryKind = 'directory' | 'file';

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
