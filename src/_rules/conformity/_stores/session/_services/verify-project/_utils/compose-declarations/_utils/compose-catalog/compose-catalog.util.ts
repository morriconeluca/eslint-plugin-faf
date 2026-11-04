import type {
  TFAFRole,
  TFAFRoles,
  TFAFSubGraphRole,
} from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveCatalog,
  TEffectiveRole,
  TRoleForm,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export const composeCatalog = (
  roles: TFAFRoles,
  subGraphRoles: readonly TFAFSubGraphRole[]
): TEffectiveCatalog => {
  const effectiveRoles: TEffectiveRole[] = [];
  const categoryToRole = new Map<string, TEffectiveRole>();
  const extensionToRole = new Map<string, TEffectiveRole>();

  for (const [rank, tier] of roles.entries()) {
    const tierRoles: readonly TFAFRole[] = 'category' in tier ? [tier] : tier;

    for (const role of tierRoles) {
      const implicitExtensions =
        role.implicitRoleExtensions === undefined
          ? []
          : [...role.implicitRoleExtensions];
      const isCategory =
        role.isCategoryNode === true || implicitExtensions.length > 0;
      const form: TRoleForm = isCategory ? 'category-nodes' : 'fragments';

      const effectiveRole: TEffectiveRole = {
        allowMultipleSymbols: role.allowMultipleSymbols === true,
        category: role.category,
        form,
        implicitExtensions,
        name: role.name,
        rank,
      };

      effectiveRoles.push(effectiveRole);
      categoryToRole.set(effectiveRole.category, effectiveRole);
      for (const extension of implicitExtensions) {
        extensionToRole.set(extension, effectiveRole);
      }
    }
  }

  return {
    categoryToRole,
    extensionToRole,
    roles: effectiveRoles,
    subGraphRoles: subGraphRoles.map((s) => s.name),
    topRank: roles.length,
  };
};
