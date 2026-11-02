/**
 * Input arguments for classifying a raw worker thread message.
 */
export type TClassifyWorkerOutcomeInput = {
  /**
   * Absolute file path to the fafconfig.ts configuration file.
   */
  readonly configPath: string;

  /**
   * Raw payload message received from the worker thread MessageChannel.
   */
  readonly rawMessage: unknown;
};
