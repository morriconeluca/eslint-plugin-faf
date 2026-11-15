import type { TModuleRecord } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TParseModuleRecordCacheInput } from './parse-module-record-cache.type.js';

import { moduleRecordCacheSchema } from './parse-module-record-cache.schema.js';

export function parseModuleRecordCache(
  input: TParseModuleRecordCacheInput
): ReadonlyMap<string, TModuleRecord> | undefined {
  const parsed = moduleRecordCacheSchema.safeParse(input.raw);
  return parsed.success &&
    parsed.data.schemaVersion === input.schemaVersion &&
    parsed.data.packageVersion === input.packageVersion
    ? new Map<string, TModuleRecord>(parsed.data.entries)
    : undefined;
}
