import type { TTreeConfig } from '../../../_types/faf.type.js';

import { resolveHorizontalHierarchy } from '../../_primitives/resolve-horizontal-hierarchy/index.js';

/**
 * Checks if A is allowed to import B according to horizontal hierarchy rules defined at their LCA.
 * Wraps `resolveHorizontalHierarchy` to return a simple boolean.
 *
 * @param lcaPath - Path of the common parent directory.
 * @param subA - Sibling directory segment of the importer.
 * @param subB - Sibling directory segment of the imported module.
 * @param config - Tree configuration.
 * @returns True if horizontal import flow is allowed, false otherwise.
 */
export function isHorizontalHierarchyAllowed(
  lcaPath: string,
  subA: string,
  subB: string,
  config: TTreeConfig
): boolean {
  return resolveHorizontalHierarchy(lcaPath, subA, subB, config).allowed;
}
