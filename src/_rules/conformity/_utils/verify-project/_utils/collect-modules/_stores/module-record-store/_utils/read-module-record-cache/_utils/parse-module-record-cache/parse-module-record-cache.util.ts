import type { TModuleRecord } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TParseModuleRecordCacheInput } from './parse-module-record-cache.type.js';

import { isPlainRecord } from '../../../../../../../../../../../../_src@shared/_utils/is-plain-record/index.js';
import { isValidModuleRecord } from './_utils/is-valid-module-record/index.js';

export function parseModuleRecordCache(
  input: TParseModuleRecordCacheInput
): ReadonlyMap<string, TModuleRecord> | undefined {
  const { packageVersion, raw, schemaVersion } = input;
  if (
    !isPlainRecord(raw) ||
    raw['schemaVersion'] !== schemaVersion ||
    raw['packageVersion'] !== packageVersion
  ) {
    return undefined;
  }
  const entries = raw['entries'];
  if (!Array.isArray(entries)) {
    return undefined;
  }

  const result = new Map<string, TModuleRecord>();
  for (const item of entries) {
    if (!Array.isArray(item) || item.length !== 2) {
      return undefined;
    }
    const entry: readonly unknown[] = item;
    const [key, record] = entry;
    if (typeof key !== 'string' || !isValidModuleRecord(record)) {
      return undefined;
    }
    result.set(key, record);
  }
  return result;
}
