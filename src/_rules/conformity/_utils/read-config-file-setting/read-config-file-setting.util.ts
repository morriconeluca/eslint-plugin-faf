import type { Rule } from 'eslint';

import { isPlainRecord } from '../../../../_src@shared/_utils/is-plain-record/index.js';

export function readConfigFileSetting(
  settings: Rule.RuleContext['settings'] | undefined
): string | undefined {
  if (!isPlainRecord(settings)) {
    return undefined;
  }
  const faf: unknown = settings['faf'];
  if (!isPlainRecord(faf)) {
    return undefined;
  }
  const configFile: unknown = faf['configFile'];
  return typeof configFile === 'string' ? configFile : undefined;
}
