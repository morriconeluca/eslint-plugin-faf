import type { TTreeConfig } from '../../../_types/faf.type.js';

/**
 * Returns the hierarchy level index of a given role.
 * Roles at lower indexes (earlier in the roles array) represent lower-level/primitive constructs,
 * while higher indexes represent higher-level/composed ones.
 *
 * @param role - Role string to look up.
 * @param config - Tree configuration containing the roles scale.
 * @returns The index of the role group or -1 if the role is not defined.
 */
export function getRoleHierarchyIndex(
  role: string,
  config: TTreeConfig
): number {
  for (let i = 0; i < config.roles.length; i++) {
    const roleGroup = config.roles[i];
    if (roleGroup && roleGroup.includes(role)) {
      return i;
    }
  }
  return -1;
}
