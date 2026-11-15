import type { Rule } from 'eslint';

import { configFileSettingsSchema } from './read-config-file-setting.schema.js';

export function readConfigFileSetting(
  settings: Rule.RuleContext['settings'] | undefined
): string | undefined {
  const parsed = configFileSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.faf.configFile : undefined;
}
