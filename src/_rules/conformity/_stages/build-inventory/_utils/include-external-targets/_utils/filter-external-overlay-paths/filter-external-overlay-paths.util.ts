import nodePath from 'node:path';

import {
  CONFIG_FILE_NAME,
  LINTABLE_EXTENSIONS,
} from '../../../../../../../../_src@shared/_constants/faf.constant.js';
import { toPosixPath } from '../../../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../../../../../_conformity@shared/_utils/compare-ordinal/index.js';

export function filterExternalOverlayPaths(
  baseDirectory: string,
  declaredOrigins: ReadonlySet<string>,
  overlayPaths: readonly string[] | undefined
): readonly string[] {
  if (overlayPaths === undefined || declaredOrigins.has('.')) {
    return [];
  }

  const originPrefixes = [...declaredOrigins].map((origin) => `${origin}/`);
  const resolvedBase = nodePath.resolve(baseDirectory);

  const normalizedPaths = overlayPaths.map((overlayPath) => {
    const absolute = nodePath.resolve(resolvedBase, toPosixPath(overlayPath));
    return toPosixPath(nodePath.relative(resolvedBase, absolute));
  });

  const eligible = normalizedPaths.filter((relative) => {
    const isOutsideBase =
      relative === '..' || relative.length === 0 || relative.startsWith('../');
    const isDisallowedTarget =
      relative === CONFIG_FILE_NAME ||
      declaredOrigins.has(relative) ||
      nodePath.isAbsolute(relative);
    const isUnderOrigin = originPrefixes.some((prefix) =>
      relative.startsWith(prefix)
    );
    const isExcluded = isOutsideBase || isDisallowedTarget || isUnderOrigin;
    return (
      !isExcluded &&
      LINTABLE_EXTENSIONS.some((extension) => relative.endsWith(extension))
    );
  });

  const sorted = [...eligible];
  sorted.sort(compareOrdinal);
  return sorted;
}
