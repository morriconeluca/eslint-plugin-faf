import type { TOutcome } from '../../_domain/_types/outcome.type.js';

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
export type TVerifyProjectResult = {
  /**
   * Complete sequence of diagnostic outcomes detected across all project stages.
   */
  readonly outcomes: readonly TOutcome[];
};
