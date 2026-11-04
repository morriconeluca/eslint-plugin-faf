/**
 * Parameter payload passed to classify oxc-resolver resolution outcomes.
 */
export type TClassifyResolutionInput = {
  /**
   * Evaluated destination alternatives associated with the matched path alias.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Prefix of the path alias applied to this request, or null if direct specifier used.
   */
  readonly aliasUsed: null | string;

  /**
   * Canonical realpath base directory anchoring relative codebase paths.
   */
  readonly canonicalBase: string;

  /**
   * Resolution outcome object with canonical path resolution applied.
   */
  readonly resolveResult: TResolverResult;

  /**
   * Module specifier string requested in source code.
   */
  readonly specifier: string;
};

/**
 * Fields of an oxc-resolver result consumed by classification.
 */
export type TResolverResult = {
  /**
   * Builtin module resolution, when the specifier names a Node builtin.
   */
  readonly builtin?: {
    /**
     * Whether the builtin is a Node.js runtime module.
     */
    readonly isRuntimeModule?: boolean;

    /**
     * Resolved builtin module name.
     */
    readonly resolved: string;
  };

  /**
   * Resolver error message when no path was produced.
   */
  readonly error?: string;

  /**
   * Canonical file path when resolution succeeded.
   */
  readonly path?: string;
};
