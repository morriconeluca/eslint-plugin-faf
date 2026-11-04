import type { TAnchoredOutcome } from './_session@shared/_types/anchored-outcome.type.js';
import type { TFileFingerprint } from './_session@shared/_types/file-fingerprint.type.js';

/**
 * Fingerprint of one file used to invalidate a memoized verification.
 */
/**
 * Memoized verification for one fafconfig.ts path.
 */
export type TSessionMemo = {
  /**
   * Anchored outcomes indexed by absolute file path.
   */
  readonly byFile: ReadonlyMap<string, readonly TAnchoredOutcome[]>;

  /**
   * Fingerprints of fafconfig.ts and the local files loaded with it.
   */
  readonly fingerprints: ReadonlyMap<string, TFileFingerprint>;

  /**
   * Identity of the source overlay used to produce the memo, empty when the text matches disk.
   */
  readonly overrideKey: string;
};

/**
 * Request for the outcomes anchored to one linted file.
 */
export type TSessionQuery = {
  /**
   * Absolute or working-directory-relative path of fafconfig.ts.
   */
  readonly configPath: string;

  /**
   * Absolute path of the file ESLint is visiting.
   */
  readonly filename: string;

  /**
   * Plugin package version used to validate the Module Record cache.
   */
  readonly packageVersion: string;

  /**
   * Current source text of the file ESLint is visiting.
   */
  readonly sourceText: string;

  /**
   * Working directory of the linter, used to resolve a relative configuration path.
   */
  readonly workingDirectory: string;
};
