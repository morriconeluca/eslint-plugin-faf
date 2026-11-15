import nodeCrypto from 'node:crypto';

import { toPosixPath } from '../../../../../../../../../../_src@shared/_utils/to-posix-path/index.js';

export function calculateContentKey(
  path: string,
  text: string,
  schemaVersion: number
): string {
  return nodeCrypto
    .createHash('sha256')
    .update(String(schemaVersion))
    .update('\0')
    .update(toPosixPath(path))
    .update('\0')
    .update(text)
    .digest('hex');
}
