import type {
  TInventory,
  TModuleCollection,
} from './_conformity@shared/_types/verification-model.type.js';
import type { TAnchorOutcomesResult } from './_stages/anchor-outcomes/index.js';

/**
 * Input arguments for collecting watched external local files observed during verification.
 */
export type TCollectWatchedExternalFilesInput = {
  /**
   * Absolute path of the directory hosting faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Comprehensive inventory model indexing all discovered codebase elements.
   */
  readonly inventory: TInventory;

  /**
   * Module collection containing all analyzed module records.
   */
  readonly modules: TModuleCollection;

  /**
   * Absolute paths of all declared tree origin directories.
   */
  readonly treeOrigins: readonly string[];
};

/**
 * Execution input parameters provided to verifyProject for architectural evaluation.
 */
export type TVerifyProjectInput = {
  /**
   * Path to the faf.config.ts configuration file governing the workspace.
   */
  readonly configPath: string;

  /**
   * In-memory file content overrides provided for unsaved open editor documents.
   * Keys are absolute paths or paths relative to the configuration directory.
   */
  readonly fileOverlays?: ReadonlyMap<string, string>;

  /**
   * Plugin package version used to validate the Module Record cache.
   */
  readonly packageVersion: string;

  /**
   * Working directory path from which relative project paths are anchored.
   */
  readonly workingDirectory: string;
};

/**
 * Verification outcome payload produced by the conformity pipeline coordinator.
 */
export type TVerifyProjectResult = TAnchorOutcomesResult & {
  /**
   * Absolute path of the directory hosting faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Whether module collection ran for this verification pass.
   */
  readonly collectedModules: boolean;

  /**
   * Absolute paths of external local files analyzed or declared during verification.
   */
  readonly externalFiles: readonly string[];

  /**
   * Absolute paths of local files loaded while evaluating faf.config.ts.
   */
  readonly loadedFiles: readonly string[];

  /**
   * Absolute paths of all declared tree origin directories.
   */
  readonly treeOrigins: readonly string[];
};
