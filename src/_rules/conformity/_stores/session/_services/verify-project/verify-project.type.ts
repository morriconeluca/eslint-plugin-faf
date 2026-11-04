import type { TAnchorOutcomesResult } from './_utils/anchor-outcomes/index.js';

/**
 * Execution input parameters provided to verifyProject for architectural evaluation.
 */
export type TVerifyProjectInput = {
  /**
   * Path to the fafconfig.ts configuration file governing the workspace.
   */
  readonly configPath: string;

  /**
   * In-memory file content overrides provided for unsaved open editor documents.
   * Keys are absolute paths or paths relative to the configuration directory.
   */
  readonly fileOverlays?: ReadonlyMap<string, string>;

  /**
   * Working directory path from which relative project paths are anchored.
   */
  readonly workingDirectory: string;
};

/**
 * Verification outcome payload produced by the verifyProject pipeline coordinator.
 */
export type TVerifyProjectResult = TAnchorOutcomesResult & {
  /**
   * Whether module collection ran and the session may persist used Module Records.
   */
  readonly collectedModules: boolean;

  /**
   * Absolute paths of local files loaded while evaluating fafconfig.ts.
   */
  readonly loadedFiles: readonly string[];
};
