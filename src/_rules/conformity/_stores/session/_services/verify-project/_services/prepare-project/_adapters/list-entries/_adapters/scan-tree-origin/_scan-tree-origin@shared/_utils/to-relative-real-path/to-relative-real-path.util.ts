import path from 'node:path';

import { toPosixPath } from '../../../../../../../../../../../_session@shared/_utils/to-posix-path/index.js';

export function toRelativeRealPath(
  rawRealPathAbsolute: string,
  resolvedBaseDirectory: string
): string {
  const normalizedReal = toPosixPath(rawRealPathAbsolute);
  const normalizedBase = toPosixPath(resolvedBaseDirectory);
  const relative = path.posix.relative(normalizedBase, normalizedReal);
  if (relative.startsWith('..') || path.posix.isAbsolute(relative)) {
    return normalizedReal;
  }
  if (relative === '') {
    return '.';
  }
  return relative;
}
