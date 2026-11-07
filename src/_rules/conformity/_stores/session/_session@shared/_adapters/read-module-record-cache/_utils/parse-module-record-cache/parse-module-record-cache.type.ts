/**
 * Input arguments for parsing a deserialized module record cache payload.
 */
export type TParseModuleRecordCacheInput = {
  /**
   * Expected plugin package version for cache compatibility.
   */
  readonly packageVersion: string;

  /**
   * Deserialized payload read from the cache file.
   */
  readonly raw: unknown;
};
