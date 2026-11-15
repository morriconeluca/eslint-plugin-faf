import { SLASH } from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function isPathInside(
  path: string,
  ancestorPaths: ReadonlySet<string>
): boolean {
  for (const ancestorPath of ancestorPaths) {
    if (path === ancestorPath || path.startsWith(`${ancestorPath}${SLASH}`)) {
      return true;
    }
  }
  return false;
}
