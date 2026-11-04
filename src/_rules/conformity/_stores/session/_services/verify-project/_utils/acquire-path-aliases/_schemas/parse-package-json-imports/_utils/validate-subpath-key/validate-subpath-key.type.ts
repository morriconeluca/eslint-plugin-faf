import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Result of validating an imports subpath key.
 */
export type TValidateSubpathKeyResult =
  | {
      /**
       * Diagnostic outcome describing the key syntax violation.
       */
      readonly outcome: TConfigOutcome;
    }
  | {
      /**
       * Indicates whether the key ends with a terminal wildcard pattern.
       */
      readonly hasWildcardKey: boolean;

      /**
       * Normalized alias prefix extracted from the key.
       */
      readonly prefix: string;
    };
