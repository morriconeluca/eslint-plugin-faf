import nodeCrypto from 'node:crypto';

import { toPosixPath } from '../../../../../_domain/_utils/to-posix-path/index.js';
import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../../../_runtime@shared/_constants/module-record-cache.constant.js';

export function calculateContentKey(path: string, text: string): string {
  return nodeCrypto
    .createHash('sha256')
    .update(String(MODULE_RECORD_CACHE_SCHEMA_VERSION))
    .update('\0')
    .update(toPosixPath(path))
    .update('\0')
    .update(text)
    .digest('hex');
}
