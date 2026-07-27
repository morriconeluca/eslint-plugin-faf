import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Normalizes any path to be relative to the project root and formats it with forward slashes.
 *
 * @param absoluteOrRelative - Input path string.
 * @returns Normalized relative path.
 */
export function toRelativePath(absoluteOrRelative: string): string {
  let abs = absoluteOrRelative;
  if (!path.isAbsolute(abs)) {
    abs = path.resolve(state.projectRoot, abs);
  }
  const rel = path.relative(state.projectRoot, abs);
  return rel.replace(/\\/g, '/');
}
