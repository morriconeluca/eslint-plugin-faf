import type { TResult } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Input arguments for loading faf.config.ts including config path and optional timeout budget.
 */
export type TLoadConfigInput = {
  /**
   * Absolute or relative path to the faf.config.ts configuration file to evaluate.
   */
  readonly configPath: string;

  /**
   * Milliseconds allowed before terminating synchronous worker execution. Defaults to 30,000ms.
   */
  readonly timeoutMs?: number;
};

/**
 * Result of the synchronous worker-based configuration loading process.
 */
export type TLoadConfigResult = TResult<TLoadedConfig>;

/**
 * Result payload representing successfully loaded configuration data and execution metadata.
 */
export type TLoadedConfig = {
  /**
   * Exported default configuration value parsed from faf.config.ts.
   */
  readonly config: unknown;

  /**
   * Absolute path to the directory hosting the loaded faf.config.ts file.
   */
  readonly configDirectory: string;

  /**
   * Absolute file path to the loaded faf.config.ts configuration file.
   */
  readonly configPath: string;

  /**
   * List of unique absolute file paths for local modules loaded during configuration evaluation.
   */
  readonly loadedFiles: readonly string[];
};

/**
 * Raw worker message emitted when postMessage throws DataCloneError.
 */
export type TRawWorkerCloneErrorMessage = {
  /**
   * Discriminant indicator denoting clone error state.
   */
  readonly kind: 'clone-error';

  /**
   * Error message describing why cloning failed.
   */
  readonly message: string;
};

/**
 * Raw worker message emitted when module evaluation throws an error.
 */
export type TRawWorkerErrorMessage = {
  /**
   * Extracted error details including message and optional code or name.
   */
  readonly error: {
    /**
     * Node.js error code if available.
     */
    readonly code?: string;

    /**
     * Error message text.
     */
    readonly message: string;

    /**
     * Error constructor name if available.
     */
    readonly name?: string;
  };

  /**
   * Discriminant indicator denoting worker error state.
   */
  readonly kind: 'error';
};

/**
 * Raw worker message emitted when the default export is a function.
 */
export type TRawWorkerFunctionMessage = {
  /**
   * Discriminant indicator denoting function export state.
   */
  readonly kind: 'function';

  /**
   * Absolute paths of all local files loaded before rejection.
   */
  readonly loadedFiles: readonly string[];
};

/**
 * Union of raw response messages transmitted through the worker MessageChannel.
 */
export type TRawWorkerMessage =
  | TRawWorkerCloneErrorMessage
  | TRawWorkerErrorMessage
  | TRawWorkerFunctionMessage
  | TRawWorkerMissingMessage
  | TRawWorkerThenableMessage
  | TRawWorkerValueMessage;

/**
 * Raw worker message emitted when the default export is missing or undefined.
 */
export type TRawWorkerMissingMessage = {
  /**
   * Discriminant indicator denoting missing default export state.
   */
  readonly kind: 'missing';

  /**
   * Absolute paths of all local files loaded before rejection.
   */
  readonly loadedFiles: readonly string[];
};

/**
 * Raw worker message emitted when the default export is a thenable or Promise.
 */
export type TRawWorkerThenableMessage = {
  /**
   * Discriminant indicator denoting thenable export state.
   */
  readonly kind: 'thenable';

  /**
   * Absolute paths of all local files loaded before rejection.
   */
  readonly loadedFiles: readonly string[];
};

/**
 * Raw worker message emitted when a configuration value is successfully loaded.
 */
export type TRawWorkerValueMessage = {
  /**
   * Discriminant indicator denoting successful value export state.
   */
  readonly kind: 'value';

  /**
   * Absolute paths of all local files imported and evaluated during execution.
   */
  readonly loadedFiles: readonly string[];

  /**
   * Exported default value retrieved from the evaluated configuration module.
   */
  readonly value: unknown;
};
