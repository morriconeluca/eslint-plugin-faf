import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TTreeConfig } from '../../../_types/faf.type.js';

/**
 * Extracts the architectural role of a file based on its name extensions.
 * Returns special role 'index' for Access Nodes.
 * Uses `state.rolesCache` to store configurations flattened as Set for O(1) lookups.
 *
 * @param fileName - Base name of the file.
 * @param config - Tree configuration.
 * @returns The matching role suffix or null if none.
 */
export function getFileRole(
  fileName: string,
  config: TTreeConfig
): null | string {
  // Exclusions: Access nodes
  if (fileName === 'index.ts' || fileName === 'index.js') {
    return 'index';
  }

  const parts = fileName.split('.');

  // Cache flat roles as a Set inside WeakMap
  let allRoles = state.rolesCache.get(config);
  if (!allRoles) {
    allRoles = new Set(config.roles.flat());
    state.rolesCache.set(config, allRoles);
  }

  // Search from right to left
  for (let i = parts.length - 2; i >= 1; i--) {
    const part = parts[i];
    if (part && allRoles.has(part)) {
      return part;
    }
  }

  return null;
}
