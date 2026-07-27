import type { TTreeConfig } from '../../../_types/faf.type.js';

/**
 * Resolves the horizontal hierarchy relationship between sub-directories subA and subB at a common ancestor lcaPath.
 * Checks local path-specific hierarchies before falling back to global hierarchies.
 * Returns both whether a hierarchy constraint is defined, and if defined, whether the import is allowed.
 *
 * @param lcaPath - Path of the common parent directory.
 * @param subA - Sibling directory segment of the importer.
 * @param subB - Sibling directory segment of the imported module.
 * @param config - Tree configuration.
 * @returns Object indicating if the hierarchy is defined and if the import is allowed.
 */
export function resolveHorizontalHierarchy(
  lcaPath: string,
  subA: string,
  subB: string,
  config: TTreeConfig
): { allowed: boolean; defined: boolean } {
  // 1. Check local hierarchies first
  const local = config.localHorizontalHierarchies?.find((lh) =>
    lh.paths.includes(lcaPath)
  );
  if (local) {
    const idxA = local.hierarchies.findIndex((group) => group.includes(subA));
    const idxB = local.hierarchies.findIndex((group) => group.includes(subB));
    if (idxA !== -1 && idxB !== -1) {
      return { allowed: idxB < idxA, defined: true };
    }
  }

  // 2. Check global hierarchies
  const globalHierarchies = config.globalHorizontalHierarchies || [];
  for (const gh of globalHierarchies) {
    const idxA = gh.findIndex((group) => group.includes(subA));
    const idxB = gh.findIndex((group) => group.includes(subB));
    if (idxA !== -1 && idxB !== -1) {
      return { allowed: idxB < idxA, defined: true };
    }
  }

  // No hierarchy defined for this pair — sibling imports forbidden by default
  return { allowed: false, defined: false };
}
