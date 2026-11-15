import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';

export function isFafConfig(
  _candidate: unknown,
  outcomeCount: number
): _candidate is TFAFConfig {
  return outcomeCount === 0;
}
