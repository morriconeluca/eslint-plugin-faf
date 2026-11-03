import {
  NODE_MODULES_MARKER,
  NODE_MODULES_PREFIX,
} from '../../../../_resolve-specifiers@shared/_constants/resolve-specifiers.constant.js';

export function isInNodeModules(posixPath: string): boolean {
  return (
    posixPath.includes(NODE_MODULES_MARKER) ||
    posixPath.startsWith(NODE_MODULES_PREFIX) ||
    posixPath.endsWith('/node_modules')
  );
}
