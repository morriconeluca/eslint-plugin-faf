import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

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
