import type { TModuleRecord } from '../../../../../_syntax/_types/module-record.type.js';

import { isPlainRecord } from '../../../../../_domain/_utils/is-plain-record/index.js';
import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../../../_runtime@shared/_constants/module-record-cache.constant.js';
import { isValidModuleRecord } from './_utils/is-valid-module-record/index.js';

export function parseModuleRecordCache(
  raw: unknown,
  packageVersion: string
): ReadonlyMap<string, TModuleRecord> | undefined {
  if (
    !isPlainRecord(raw) ||
    raw['schemaVersion'] !== MODULE_RECORD_CACHE_SCHEMA_VERSION ||
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
