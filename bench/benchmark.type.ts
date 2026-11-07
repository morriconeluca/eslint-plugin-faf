/**
 * Performance budget evaluation record for a single benchmark metric.
 */
export type TBenchmarkBudget = {
  /**
   * Upper bound threshold defined in milliseconds.
   */
  readonly budgetMs: number;

  /**
   * Human-readable metric identification label.
   */
  readonly metric: string;

  /**
   * Observed duration recorded during the benchmark execution in milliseconds.
   */
  readonly observedMs: number;

  /**
   * Flag indicating whether the observed duration respects the allocated budget threshold.
   */
  readonly satisfied: boolean;
};

/**
 * Comprehensive benchmark measurement results for a specific logical node scale.
 */
export type TBenchmarkResult = {
  /**
   * Evaluated performance budget constraints for this logical node scale.
   */
  readonly budgets: readonly TBenchmarkBudget[];

  /**
   * Cold verification duration in milliseconds without any existing cache.
   */
  readonly coldMs: number;

  /**
   * Total number of logical nodes contained in the benchmark project.
   */
  readonly logicalNodeCount: number;

  /**
   * Estimated average overhead per linted file during in-session memoization in milliseconds.
   */
  readonly overheadPerFileMs: number;

  /**
   * Byte size of the persistent module records cache file generated on disk.
   */
  readonly recordsCacheSizeBytes: number;

  /**
   * In-session memoized verification duration in milliseconds for an identical query.
   */
  readonly warmInSessionMs: number;

  /**
   * Warm verification duration in milliseconds executed inside a fresh process using disk cache.
   */
  readonly warmPersistentCacheMs: number;
};

/**
 * Aggregated benchmark results across multiple project scales.
 */
export type TBenchmarkSuiteResult = {
  /**
   * Array of individual scale measurement reports.
   */
  readonly results: readonly TBenchmarkResult[];

  /**
   * ISO 8601 formatted timestamp indicating when the benchmark execution occurred.
   */
  readonly timestamp: string;
};

/**
 * Payload produced by the child runner subprocess measuring cold or warm execution.
 */
export type TChildMeasurementResult = {
  /**
   * Measured execution duration in milliseconds.
   */
  readonly elapsedMs: number;

  /**
   * Flag indicating whether child execution completed successfully.
   */
  readonly ok: boolean;
};

/**
 * Synthetic project handle exposing paths and lifecycle cleanup.
 */
export type TGeneratedProject = {
  /**
   * Cleanup callback function releasing disk resources allocated for the fixture.
   */
  readonly cleanup: () => void;

  /**
   * Relative POSIX path to the primary entry file targeted by the linter.
   */
  readonly entryFile: string;

  /**
   * Total count of logical nodes instantiated inside this project.
   */
  readonly logicalNodeCount: number;

  /**
   * Absolute filesystem path pointing to the created synthetic project root.
   */
  readonly projectPath: string;

  /**
   * Relative POSIX path to a secondary file for verifying in-session memo queries.
   */
  readonly secondFile: string;
};

/**
 * Configuration options controlling the synthetic project generator.
 */
export type TGenerateProjectOptions = {
  /**
   * Desired number of logical nodes to produce in the synthetic project.
   */
  readonly logicalNodeCount: number;

  /**
   * Optional custom root directory path for project creation.
   */
  readonly targetDirectory?: string;
};

/**
 * Input arguments supplied to measurement routines.
 */
export type TMeasureOptions = {
  /**
   * Relative POSIX path identifying the primary file targeted by the verification.
   */
  readonly entryFile: string;

  /**
   * Logical node quantity assigned to the benchmark run.
   */
  readonly logicalNodeCount: number;

  /**
   * Absolute filesystem path to the benchmark project root.
   */
  readonly projectPath: string;

  /**
   * Relative POSIX path identifying the secondary file targeted by in-session queries.
   */
  readonly secondFile: string;
};
