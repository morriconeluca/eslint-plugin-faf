import type { Rule } from 'eslint';

import { isRecord } from './_utils/is-record/index.js';

export function readConfigFileSetting(
  settings: Rule.RuleContext['settings'] | undefined
): string | undefined {
  if (!isRecord(settings)) {
    return undefined;
  }
  const faf: unknown = settings['faf'];
  if (!isRecord(faf)) {
    return undefined;
  }
  const configFile: unknown = faf['configFile'];
  return typeof configFile === 'string' ? configFile : undefined;
}
