import type { TOriginKind } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Punctual directory reference that must exist inside the allowed trees.
 */
export type TDirectoryReferenceCheck = {
  /**
   * Inventory, owned origins, and configuration base used to judge the path.
   */
  readonly context: TReferenceContext;

  /**
   * English noun used in the diagnostic to name the configured element.
   */
  readonly label: string;

  /**
   * Format section tag that defines the property being checked.
   */
  readonly normativeReference: string;

  /**
   * Configured path, relative to the directory of `fafconfig.ts`.
   */
  readonly path: string;

  /**
   * Object access path of the configured value.
   */
  readonly propertyPath: string;

  /**
   * Common or local scope that is allowed to name this directory.
   */
  readonly scope: TScopeBinding;
};

/**
 * Root node file enumerated by a Root Fragment declaration.
 */
export type TEnumeratedRootNode = {
  /**
   * Directory of the Root Fragment that lists this file by its direct name.
   */
  readonly rootFragmentPath: string;

  /**
   * Apical origin of the Fractal Tree that contains the Root Fragment.
   */
  readonly treeOrigin: string;
};

/**
 * Punctual file reference that must exist inside the allowed trees.
 */
export type TFileReferenceCheck = {
  /**
   * Inventory, owned origins, and configuration base used to judge the path.
   */
  readonly context: TReferenceContext;

  /**
   * English noun used in the diagnostic to name the configured element.
   */
  readonly label: string;

  /**
   * Format section tag that defines the property being checked.
   */
  readonly normativeReference: string;

  /**
   * Configured path, relative to the directory of `fafconfig.ts`.
   */
  readonly path: string;

  /**
   * Object access path of the configured value.
   */
  readonly propertyPath: string;

  /**
   * Common or local scope that is allowed to name this file.
   */
  readonly scope: TScopeBinding;
};

/**
 * Apical origin directory that must exist and must not sit inside another tree.
 */
export type TOriginDirectoryCheck = {
  /**
   * Inventory and configuration base used to judge the origin path.
   */
  readonly context: TReferenceContext;

  /**
   * English noun used in the diagnostic to name the origin.
   */
  readonly label: string;

  /**
   * Format section tag that defines the origin property.
   */
  readonly normativeReference: string;

  /**
   * Declared origin path relative to the directory of `fafconfig.ts`.
   */
  readonly path: string;

  /**
   * Object access path of the origin declaration.
   */
  readonly propertyPath: string;
};

/**
 * Tree origin owned by this configuration, with the local element that declares it.
 */
export type TOwnedOrigin = {
  /**
   * Index of the owning `locals` element, or a negative sentinel when only effective declarations name the origin.
   */
  readonly localIndex: number;

  /**
   * Whether the origin is a Root Fragment or a Root Layer.
   */
  readonly originKind: TOriginKind;
};

/**
 * Lookup data shared by punctual reference checks.
 */
export type TReferenceContext = {
  /**
   * Alias prefixes acquired for this configuration, matched at segment boundaries.
   */
  readonly aliasPrefixes: readonly string[];

  /**
   * POSIX directory of `fafconfig.ts`, the sole base of relative references.
   */
  readonly baseDirectory: string;

  /**
   * Enumerated Root Node files keyed by their path relative to `fafconfig.ts`.
   */
  readonly enumeratedRootNodes: ReadonlyMap<string, TEnumeratedRootNode>;

  /**
   * Inventory whose paths are already relative to the configuration directory.
   */
  readonly inventory: TInventory;

  /**
   * Origins of the Fractal Trees composed for this configuration.
   */
  readonly ownedOrigins: ReadonlyMap<string, TOwnedOrigin>;
};

/**
 * Whether a reference is inherited from `common` or written on one `locals` element.
 */
export type TScopeBinding = {
  /**
   * Scope name: `common` for shared references, `local` for one `locals` element.
   */
  readonly kind: string;

  /**
   * Index of the owning `locals` element. Absent for common references.
   */
  readonly localIndex?: number;
};
