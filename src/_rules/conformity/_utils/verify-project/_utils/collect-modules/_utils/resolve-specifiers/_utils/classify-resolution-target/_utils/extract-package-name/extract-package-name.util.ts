import { assertInvariant } from '../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import {
  NODE_MODULES_MARKER,
  NODE_MODULES_PREFIX,
} from '../../../../_resolve-specifiers@shared/_constants/resolve-specifiers.constant.js';

export function extractPackageName(posixPath: string): string {
  const index = posixPath.lastIndexOf(NODE_MODULES_MARKER);
  let remainder: string;

  if (index !== -1) {
    remainder = posixPath.slice(index + NODE_MODULES_MARKER.length);
  } else if (posixPath.startsWith(NODE_MODULES_PREFIX)) {
    remainder = posixPath.slice(NODE_MODULES_PREFIX.length);
  } else {
    remainder = posixPath;
  }

  const segments = remainder.split('/');
  const first = segments[0];
  assertInvariant(first !== undefined, 'Expected segment');
  const second = segments[1];
  return second !== undefined && first.startsWith('@')
    ? `${first}/${second}`
    : first;
}
