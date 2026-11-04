/**
 * Input parameters required to read the persistent module record cache from disk.
 */
export type TReadModuleRecordCacheInput = {
  /**
   * Root directory of the project containing fafconfig.ts and node_modules.
   */
  readonly baseDirectory: string;

  /**
   * Current package version of eslint-plugin-faf required for validity checking.
   */
  readonly packageVersion: string;
};
