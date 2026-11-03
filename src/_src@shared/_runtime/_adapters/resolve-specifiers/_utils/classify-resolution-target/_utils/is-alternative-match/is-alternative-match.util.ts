import nodePath from 'node:path';

import { toPosixPath } from '../../../../../../../_domain/_utils/to-posix-path/index.js';

export function isAlternativeMatch(
  resolvedPath: string,
  alternative: string
): boolean {
  const normResolved = toPosixPath(nodePath.posix.normalize(resolvedPath));
  const normAlt = toPosixPath(nodePath.posix.normalize(alternative));

  if (normAlt === '.' || normAlt === './') {
    return !normResolved.startsWith('../');
  }

  if (
    normResolved === normAlt ||
    normResolved.startsWith(`${normAlt}/`) ||
    normResolved.startsWith(`${normAlt}.`)
  ) {
    return true;
  }

  const altExtension = nodePath.posix.extname(normAlt);
  if (altExtension !== '') {
    const altWithoutExtension = normAlt.slice(0, -altExtension.length);
    const resolvedExtension = nodePath.posix.extname(normResolved);
    if (
      resolvedExtension !== '' &&
      normResolved.slice(0, -resolvedExtension.length) === altWithoutExtension
    ) {
      return true;
    }
  }

  return false;
}
