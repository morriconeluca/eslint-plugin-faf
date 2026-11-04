import nodePathPosix from 'node:path/posix';

import { LINTABLE_EXTENSIONS } from '../../../../../../../../../../../../../_src@shared/_constants/faf.constant.js';

export function isLintablePath(filePath: string): boolean {
  const extension = nodePathPosix.extname(filePath);
  return LINTABLE_EXTENSIONS.some((candidate) => candidate === extension);
}
