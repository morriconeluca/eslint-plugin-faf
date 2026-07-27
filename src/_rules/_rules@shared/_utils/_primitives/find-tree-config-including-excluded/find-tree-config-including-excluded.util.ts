import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TFafSettings, TTreeConfig } from '../../../_types/faf.type.js';

/**
 * Finds the tree configuration that includes the given relative file path,
 * even if it is otherwise excluded (Foreign Domain). Uses `state.treeConfigIncludingExcludedCache`
 * for performance.
 *
 * @param relPath - Path relative to the project root.
 * @param settings - The global FAF settings containing trees configuration.
 * @returns The matching tree configuration or null if not found.
 */
export function findTreeConfigIncludingExcluded(
  relPath: string,
  settings: TFafSettings
): null | TTreeConfig {
  if (!settings || !settings.trees) {
    return null;
  }

  const cached = state.treeConfigIncludingExcludedCache.get(relPath);
  if (cached !== undefined) {
    return cached;
  }

  let result: null | TTreeConfig = null;
  for (const tree of settings.trees) {
    const isIncluded = tree.includes.some(
      (inc) => relPath === inc || relPath.startsWith(inc + '/')
    );

    if (isIncluded) {
      result = tree;
      break;
    }
  }

  state.treeConfigIncludingExcludedCache.set(relPath, result);
  return result;
}
