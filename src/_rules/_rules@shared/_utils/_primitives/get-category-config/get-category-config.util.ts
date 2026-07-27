import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TCategoryConfig, TTreeConfig } from '../../../_types/faf.type.js';

/**
 * Returns the TCategoryConfig for a given path by traversing upwards to the closest Category folder.
 * Result is cached in `state.categoryConfigCache`.
 *
 * @param relDirPath - Directory path relative to the project root.
 * @param config - Tree configuration.
 * @returns The Category configuration or null if not in a Category.
 */
export function getCategoryConfig(
  relDirPath: string,
  config: TTreeConfig
): null | TCategoryConfig {
  const cached = state.categoryConfigCache.get(relDirPath);
  if (cached !== undefined) {
    return cached;
  }

  let result: null | TCategoryConfig = null;
  let current = relDirPath;
  while (current && current !== '.' && current !== '/') {
    const folderName = path.basename(current);
    if (folderName.startsWith('_') && !folderName.includes('@shared')) {
      const catConfig = config.categories?.find((c) => c.name === folderName);
      if (catConfig) {
        result = catConfig;
        break;
      }
    } else {
      break;
    }
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) break;
    current = parent;
  }

  state.categoryConfigCache.set(relDirPath, result);
  return result;
}
