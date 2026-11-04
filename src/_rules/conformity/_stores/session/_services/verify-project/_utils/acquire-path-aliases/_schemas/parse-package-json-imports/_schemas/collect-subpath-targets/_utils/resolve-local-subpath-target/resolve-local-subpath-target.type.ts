import type { TConfigOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Result of resolving a single local target string.
 */
export type TResolveLocalSubpathTargetResult =
  | {
      /**
       * Diagnostic outcome describing the invalid target path or base.
       */
      readonly outcome: TConfigOutcome;
    }
  | {
      /**
       * Normalized local target base path, or null if target is external.
       */
      readonly target: null | string;
    };
