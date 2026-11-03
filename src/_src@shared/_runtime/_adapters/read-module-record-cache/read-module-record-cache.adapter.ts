import nodeFs from 'node:fs';
import nodePath from 'node:path';
import v8 from 'node:v8';

import type { TModuleRecord } from '../../../_syntax/_types/module-record.type.js';
import type { TReadModuleRecordCacheInput } from './read-module-record-cache.type.js';

import { parseModuleRecordCache } from './_schemas/parse-module-record-cache/index.js';

export function readModuleRecordCache(
  input: TReadModuleRecordCacheInput
): ReadonlyMap<string, TModuleRecord> {
  const cachePath = nodePath.join(
    input.baseDirectory,
    'node_modules/.cache/eslint-plugin-faf',
    'records.cache'
  );

  try {
    const rawPayload: unknown = v8.deserialize(nodeFs.readFileSync(cachePath));
    return (
      parseModuleRecordCache(rawPayload, input.packageVersion) ??
      new Map<string, TModuleRecord>()
    );
  } catch {
    return new Map<string, TModuleRecord>();
  }
}
