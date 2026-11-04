import { isRecord } from './_utils/is-record/index.js';

export function readConfigFileSetting(settings: unknown): string | undefined {
  if (!isRecord(settings)) {
    return undefined;
  }
  const faf = settings['faf'];
  if (!isRecord(faf)) {
    return undefined;
  }
  const configFile = faf['configFile'];
  return typeof configFile === 'string' ? configFile : undefined;
}
