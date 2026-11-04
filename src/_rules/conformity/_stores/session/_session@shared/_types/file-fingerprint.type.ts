/**
 * Fingerprint of one file used to invalidate a memoized verification.
 */
export type TFileFingerprint = {
  /**
   * Modification time in milliseconds since the Unix epoch, or -1 when unreadable.
   */
  readonly mtimeMs: number;

  /**
   * Absolute path of the fingerprinted file.
   */
  readonly path: string;

  /**
   * File size in bytes, or -1 when unreadable.
   */
  readonly size: number;
};
