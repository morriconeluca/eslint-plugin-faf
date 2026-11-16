import type { TAnchoredOutcome } from '../../_conformity@shared/_types/anchored-outcome.type.js';
import type { TFileFingerprint } from './_session@shared/_types/file-fingerprint.type.js';

/**
 * Result of looking up memoized outcomes for a linted file.
 */
export type TSessionLookupResult =
  | {
      /**
       * Discriminant indicating a fresh memo hit.
       */
      readonly hit: true;

      /**
       * Anchored outcomes for the requested linted file.
       */
      readonly outcomes: readonly TAnchoredOutcome[];
    }
  | {
      /**
       * Resolved absolute path of faf.config.ts.
       */
      readonly configPath: string;

      /**
       * Discriminant indicating that verification must run.
       */
      readonly hit: false;

      /**
       * Identity of the source overlay for this linted file.
       */
      readonly overlayKey: string;

      /**
       * Source overlay text when it differs from disk, or null when matching disk.
       */
      readonly overlayText: null | string;
    };

/**
 * Memoized verification for one faf.config.ts path.
 */
export type TSessionMemo = {
  /**
   * Anchored outcomes indexed by absolute file path.
   */
  readonly byFile: ReadonlyMap<string, readonly TAnchoredOutcome[]>;

  /**
   * Fingerprints of faf.config.ts and the local files loaded with it.
   */
  readonly fingerprints: ReadonlyMap<string, TFileFingerprint>;

  /**
   * Identity of the source overlay used to produce the memo, empty when the text matches disk.
   */
  readonly overrideKey: string;

  /**
   * Absolute paths of fractal tree origin directories.
   */
  readonly treeOrigins: readonly string[];

  /**
   * Absolute paths of watched configuration and external files.
   */
  readonly watchedFiles: readonly string[];
};

/**
 * Request to look up memoized outcomes for one linted file.
 */
export type TSessionQuery = {
  /**
   * Absolute or working-directory-relative path of faf.config.ts.
   */
  readonly configPath: string;

  /**
   * Absolute path of the file ESLint is visiting.
   */
  readonly filename: string;

  /**
   * Current source text of the file ESLint is visiting.
   */
  readonly sourceText: string;

  /**
   * Working directory of the linter, used to resolve a relative configuration path.
   */
  readonly workingDirectory: string;
};

/**
 * Verification snapshot stored in the session memo after a fresh verification run.
 */
export type TSessionSaveInput = {
  /**
   * Absolute path of the directory hosting faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Anchored outcomes indexed by absolute file path.
   */
  readonly byFile: ReadonlyMap<string, readonly TAnchoredOutcome[]>;

  /**
   * Resolved absolute path of faf.config.ts.
   */
  readonly configPath: string;

  /**
   * Absolute paths of external local files watched for invalidation.
   */
  readonly externalFiles: readonly string[];

  /**
   * Absolute paths of local files loaded while evaluating faf.config.ts.
   */
  readonly loadedFiles: readonly string[];

  /**
   * Identity of the source overlay used during verification.
   */
  readonly overrideKey: string;

  /**
   * Absolute paths of fractal tree origin directories.
   */
  readonly treeOrigins: readonly string[];
};
