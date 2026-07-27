import type { TCacheState } from './cache.type.js';

/**
 * Persistent global caching state mapping to optimized native collections.
 * Persists for the lifetime of a single ESLint run.
 * Cleaned up between testing suites dynamically using clearDirCache.
 */
export const state: TCacheState = {
  categoryConfigCache: new Map(),
  classifyCache: new Map(),
  dirCache: {},
  packageImports: null,
  projectRoot: process.cwd(),
  resolvedImportPathCache: new Map(),
  rolesCache: new WeakMap(),
  treeConfigCache: new Map(),
  treeConfigIncludingExcludedCache: new Map(),
};
