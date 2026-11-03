import nodeCrypto from 'node:crypto';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import v8 from 'node:v8';

import type {
  TModuleRecordCachePayload,
  TWriteModuleRecordCacheInput,
} from './write-module-record-cache.type.js';

import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../_runtime@shared/_constants/module-record-cache.constant.js';

export function writeModuleRecordCache(
  input: TWriteModuleRecordCacheInput
): void {
  const cacheDirectory = nodePath.join(
    input.baseDirectory,
    'node_modules/.cache/eslint-plugin-faf'
  );
  const targetPath = nodePath.join(cacheDirectory, 'records.cache');
  const temporaryPath = nodePath.join(
    cacheDirectory,
    `.records.cache.${process.pid}.${Date.now()}.${nodeCrypto.randomBytes(8).toString('hex')}.tmp`
  );

  try {
    nodeFs.mkdirSync(cacheDirectory, { recursive: true });
    const payload: TModuleRecordCachePayload = {
      entries: [...input.entries],
      packageVersion: input.packageVersion,
      schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
    };
    nodeFs.writeFileSync(temporaryPath, v8.serialize(payload));
    nodeFs.renameSync(temporaryPath, targetPath);
  } catch {
    try {
      nodeFs.rmSync(temporaryPath);
    } catch {
      return;
    }
  }
}
