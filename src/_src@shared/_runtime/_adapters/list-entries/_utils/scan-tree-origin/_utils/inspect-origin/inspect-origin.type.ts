import type { TOutcome } from '../../../../../../../_domain/_types/outcome.type.js';

/**
 * Result of inspecting an individual tree origin root directory.
 */
export type TInspectOriginResult =
  | {
      /**
       * Failure discriminator indicating the origin could not be verified.
       */
      readonly ok: false;

      /**
       * Diagnostic outcome describing why the origin was missing, unreadable, or invalid.
       */
      readonly outcome: TOutcome;
    }
  | {
      /**
       * Whether the inspected origin directory is a symbolic link.
       */
      readonly isSymlink: boolean;

      /**
       * Success discriminator indicating the origin was verified.
       */
      readonly ok: true;

      /**
       * Real path of the origin directory relative to the base directory.
       */
      readonly originReal: string;
    };
