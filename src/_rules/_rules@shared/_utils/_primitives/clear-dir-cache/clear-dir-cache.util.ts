import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Resets all in-memory caches and state parameters.
 * Primarily used in test suites (before/after hooks) to prevent test contamination
 * and ensure a clean slate between rule executions.
 */
export function clearDirCache(): void {
  state.dirCache = {};
  state.classifyCache.clear();
  state.categoryConfigCache.clear();
  state.treeConfigCache.clear();
  state.treeConfigIncludingExcludedCache.clear();
  state.resolvedImportPathCache.clear();
  state.packageImports = null;
}
