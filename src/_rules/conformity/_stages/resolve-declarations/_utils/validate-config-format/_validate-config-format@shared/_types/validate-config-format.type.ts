/**
 * Record representing an implicit role extension occurrence for catalog invariant checking.
 */
export type TExtensionEntry = {
  /**
   * File extension with leading dot.
   */
  readonly extension: string;

  /**
   * Property access path of the extension declaration.
   */
  readonly path: string;

  /**
   * Associated role name owning this implicit extension.
   */
  readonly roleName: string;
};

/**
 * Record representing a declared architectural role occurrence for catalog invariant checking.
 */
export type TRoleEntry = {
  /**
   * Assigned category directory name including leading underscore.
   */
  readonly category: string;

  /**
   * Role name declared within the catalog.
   */
  readonly name: string;

  /**
   * Property access path of the role declaration.
   */
  readonly path: string;
};

/**
 * Result collection returned from roles validation for subsequent invariant analysis.
 */
export type TRolesValidationResult = {
  /**
   * List of valid implicit extension declarations.
   */
  readonly extensionEntries: readonly TExtensionEntry[];

  /**
   * List of valid role declarations.
   */
  readonly roleEntries: readonly TRoleEntry[];
};

/**
 * Record representing a sub-graph role occurrence for catalog invariant checking.
 */
export type TSubGraphRoleEntry = {
  /**
   * Sub-graph role name declared within the catalog.
   */
  readonly name: string;

  /**
   * Property access path of the sub-graph role declaration.
   */
  readonly path: string;
};
