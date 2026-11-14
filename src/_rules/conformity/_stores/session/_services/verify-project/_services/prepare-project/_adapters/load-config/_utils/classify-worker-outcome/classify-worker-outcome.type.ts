/**
 * Input arguments for classifying a raw worker thread message.
 */
export type TClassifyWorkerOutcomeInput = {
  /**
   * Absolute file path to the faf.config.ts configuration file.
   */
  readonly configPath: string;

  /**
   * Parsed package.json object if present in the configuration directory.
   */
  readonly packageJson?: Record<string, unknown>;

  /**
   * Raw payload message received from the worker thread MessageChannel.
   */
  readonly rawMessage: unknown;
};
