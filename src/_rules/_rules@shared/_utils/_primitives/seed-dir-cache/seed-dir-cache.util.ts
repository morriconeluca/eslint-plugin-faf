import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Manually populates the directory cache for testing and validation.
 * Automatically invalidates dependent caches (`classifyCache`, `categoryConfigCache`, `resolvedImportPathCache`)
 * to prevent test state leakage.
 *
 * @param relDirPath - Mocked directory path.
 * @param files - Array of mock file names.
 * @param dirs - Array of mock sub-directory names.
 */
export function seedDirCache(
  relDirPath: string,
  files: string[],
  dirs: string[]
): void {
  const absPath = path
    .resolve(state.projectRoot, relDirPath)
    .replace(/\\/g, '/');
  state.dirCache[absPath] = { dirs, files };

  // Invalidate caches that could be affected by new folder layouts
  state.classifyCache.clear();
  state.categoryConfigCache.clear();
  state.resolvedImportPathCache.clear();
}
