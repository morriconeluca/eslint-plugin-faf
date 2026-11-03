import type {
  TLoadConfigInput as TLoadConfigSharedInput,
  TLoadConfigResult as TLoadConfigSharedResult,
  TLoadedConfig as TLoadedConfigShared,
  TRawWorkerCloneErrorMessage as TRawWorkerCloneErrorSharedMessage,
  TRawWorkerErrorMessage as TRawWorkerErrorSharedMessage,
  TRawWorkerFunctionMessage as TRawWorkerFunctionSharedMessage,
  TRawWorkerMissingMessage as TRawWorkerMissingSharedMessage,
  TRawWorkerMessage as TRawWorkerSharedMessage,
  TRawWorkerThenableMessage as TRawWorkerThenableSharedMessage,
  TRawWorkerValueMessage as TRawWorkerValueSharedMessage,
} from './_load-config@shared/_types/load-config.type.js';

/**
 * Input arguments for loading fafconfig.ts including config path and optional timeout budget.
 */
export type TLoadConfigInput = TLoadConfigSharedInput;

/**
 * Result of the synchronous worker-based configuration loading process.
 */
export type TLoadConfigResult = TLoadConfigSharedResult;

/**
 * Result payload representing successfully loaded configuration data and execution metadata.
 */
export type TLoadedConfig = TLoadedConfigShared;

/**
 * Raw worker message emitted when postMessage throws DataCloneError.
 */
export type TRawWorkerCloneErrorMessage = TRawWorkerCloneErrorSharedMessage;

/**
 * Raw worker message emitted when module evaluation throws an error.
 */
export type TRawWorkerErrorMessage = TRawWorkerErrorSharedMessage;

/**
 * Raw worker message emitted when the default export is a function.
 */
export type TRawWorkerFunctionMessage = TRawWorkerFunctionSharedMessage;

/**
 * Union of raw response messages transmitted through the worker MessageChannel.
 */
export type TRawWorkerMessage = TRawWorkerSharedMessage;

/**
 * Raw worker message emitted when the default export is missing or undefined.
 */
export type TRawWorkerMissingMessage = TRawWorkerMissingSharedMessage;

/**
 * Raw worker message emitted when the default export is a Promise or thenable object.
 */
export type TRawWorkerThenableMessage = TRawWorkerThenableSharedMessage;

/**
 * Raw worker message emitted when a valid configuration value is resolved.
 */
export type TRawWorkerValueMessage = TRawWorkerValueSharedMessage;
