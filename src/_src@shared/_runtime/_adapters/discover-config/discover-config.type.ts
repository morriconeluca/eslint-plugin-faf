import type { TResult } from '../../../_domain/_types/outcome.type.js';

/**
 * Input arguments for configuration discovery specifying explicit path or working directory.
 */
export type TDiscoverConfigInput = {
  /**
   * Optional explicit configuration file path configured via settings.faf.configFile.
   */
  readonly configFile?: string;

  /**
   * Working directory path from which relative paths are resolved or upward search begins.
   */
  readonly workingDirectory: string;
};

/**
 * Result of configuration discovery yielding discovered file paths or diagnostic outcomes.
 */
export type TDiscoverConfigResult = TResult<TDiscoveredConfig>;

/**
 * Discovered configuration paths containing resolved file location and parent directory.
 */
export type TDiscoveredConfig = {
  /**
   * Absolute path to the directory hosting the discovered fafconfig.ts file.
   */
  readonly configDirectory: string;

  /**
   * Absolute path to the discovered fafconfig.ts configuration file.
   */
  readonly configPath: string;
};
