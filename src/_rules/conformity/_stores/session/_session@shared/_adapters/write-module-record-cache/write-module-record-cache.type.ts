import type { TModuleRecord } from '../../_types/module-record.type.js';

/**
 * Versioned on-disk payload of content-keyed module records.
 */
export type TModuleRecordCachePayload = {
  /**
   * Pairs of content digest and module record persisted for a later execution.
   */
  readonly entries: readonly (readonly [string, TModuleRecord])[];

  /**
   * Plugin package version that wrote the file; a mismatch invalidates the file.
   */
  readonly packageVersion: string;

  /**
   * Record-layout version that wrote the file; a mismatch invalidates the file.
   */
  readonly schemaVersion: number;
};

/**
 * Input parameters required to atomically persist module records to disk.
 */
export type TWriteModuleRecordCacheInput = {
  /**
   * Root directory of the project containing fafconfig.ts and node_modules.
   */
  readonly baseDirectory: string;

  /**
   * Complete map of validated module records to persist.
   */
  readonly entries: ReadonlyMap<string, TModuleRecord>;

  /**
   * Current package version of eslint-plugin-faf embedded into cache metadata.
   */
  readonly packageVersion: string;
};
