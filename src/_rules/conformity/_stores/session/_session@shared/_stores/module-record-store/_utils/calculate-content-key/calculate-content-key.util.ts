import nodeCrypto from 'node:crypto';

import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../../../_constants/module-record-cache.constant.js';
import { toPosixPath } from '../../../../_utils/to-posix-path/index.js';

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
