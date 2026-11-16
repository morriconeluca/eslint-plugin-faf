import type { TResolvedTarget } from '../../../../_conformity@shared/_types/verification-model.type.js';

/**
 * Memoized resolution result caching target and matched alias metadata.
 */
export type TCachedResolution = {
  /**
   * Evaluated candidate target paths corresponding to the matched alias prefix.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Prefix of the path alias applied to the specifier, or null if direct.
   */
  readonly aliasUsed: null | string;

  /**
   * Target outcome resolved by the underlying oxc-resolver instance.
   */
  readonly target: TResolvedTarget;
};
