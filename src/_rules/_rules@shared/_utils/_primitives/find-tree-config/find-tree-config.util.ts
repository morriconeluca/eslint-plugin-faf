import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TFafSettings, TTreeConfig } from '../../../_types/faf.type.js';

/**
 * Finds the tree configuration that includes the given relative file path,
 * excluding paths designated as Foreign Domains. Uses `state.treeConfigCache`
 * to speed up subsequent queries.
 *
 * @param relPath - Path relative to the project root.
 * @param settings - The global FAF settings containing trees configuration.
 * @returns The matching tree configuration or null if not found or excluded.
 */
export function findTreeConfig(
  relPath: string,
  settings: TFafSettings
): null | TTreeConfig {
  if (!settings || !settings.trees) {
    return null;
  }

  const cached = state.treeConfigCache.get(relPath);
  if (cached !== undefined) {
    return cached;
  }

  let result: null | TTreeConfig = null;
  for (const tree of settings.trees) {
    const isIncluded = tree.includes.some(
      (inc) => relPath === inc || relPath.startsWith(inc + '/')
    );
    const isExcluded = tree.excludes?.some(
      (exc) => relPath === exc || relPath.startsWith(exc + '/')
    );

    if (isIncluded && !isExcluded) {
      result = tree;
      break;
    }
  }

  state.treeConfigCache.set(relPath, result);
  return result;
}
