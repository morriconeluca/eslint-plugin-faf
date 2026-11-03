import type { ResolveResult } from 'oxc-resolver';

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
  readonly resolveResult: ResolveResult;

  /**
   * Module specifier string requested in source code.
   */
  readonly specifier: string;
};
