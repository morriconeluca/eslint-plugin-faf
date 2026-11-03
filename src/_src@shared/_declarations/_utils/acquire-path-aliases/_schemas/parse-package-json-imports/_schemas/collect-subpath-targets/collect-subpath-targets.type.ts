import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';

/**
 * Result of collecting subpath targets from an import entry value.
 */
export type TCollectSubpathTargetsResult =
  | {
      /**
       * Collected local target base paths.
       */
      readonly targets: readonly string[];
    }
  | {
      /**
       * Diagnostic outcome describing the format or resolution error.
       */
      readonly outcome: TConfigOutcome;
    };
