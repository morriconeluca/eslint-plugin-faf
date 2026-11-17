import type { TExternalDirectoryCheck } from './should-traverse-external-directory.type.js';

import {
  NODE_MODULES_DIRECTORY,
  SKIPPED_DOT_DIRECTORIES,
  SKIPPED_ROOT_DIRECTORIES,
} from './should-traverse-external-directory.constant.js';

export function shouldTraverseExternalDirectory(
  input: TExternalDirectoryCheck
): boolean {
  if (
    input.name === NODE_MODULES_DIRECTORY ||
    input.declaredOrigins.has(input.relativePath)
  ) {
    return false;
  }
  if (input.name.startsWith('.') && SKIPPED_DOT_DIRECTORIES.has(input.name)) {
    return false;
  }
  if (input.isAtRoot && SKIPPED_ROOT_DIRECTORIES.has(input.name)) {
    return false;
  }
  return true;
}
