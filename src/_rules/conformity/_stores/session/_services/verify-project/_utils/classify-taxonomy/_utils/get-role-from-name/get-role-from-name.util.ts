import type { TRoleAttribution } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveCatalog } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { ABSENT_ROLE_ATTRIBUTION, DOT } from './get-role-from-name.constant.js';

export function getRoleFromName(
  fileName: string,
  catalog: TEffectiveCatalog
): TRoleAttribution {
  const firstDotIndex = fileName.indexOf(DOT);
  if (firstDotIndex <= 0) {
    return ABSENT_ROLE_ATTRIBUTION;
  }

  const possibleImplicitExtension = fileName.slice(firstDotIndex);
  const implicitRole = catalog.extensionToRole.get(possibleImplicitExtension);
  if (implicitRole !== undefined) {
    return {
      kind: 'implicit',
      roleName: implicitRole.name,
    };
  }

  const afterName = fileName.slice(firstDotIndex + 1);
  const roleDotIndex = afterName.indexOf(DOT);
  if (roleDotIndex === -1) {
    return ABSENT_ROLE_ATTRIBUTION;
  }

  const roleCandidate = afterName.slice(0, roleDotIndex);
  const isRole =
    catalog.subGraphRoles.includes(roleCandidate) ||
    catalog.roles.some((role) => role.name === roleCandidate);

  if (!isRole) {
    return ABSENT_ROLE_ATTRIBUTION;
  }

  const extensionWithDot = afterName.slice(roleDotIndex);
  const extensionWithoutDot = afterName.slice(roleDotIndex + 1);

  const isSingleFinalSegment =
    extensionWithoutDot.length > 0 && !extensionWithoutDot.includes(DOT);

  const isImplicitExtensionSequence =
    catalog.extensionToRole.has(extensionWithDot);

  if (isSingleFinalSegment || isImplicitExtensionSequence) {
    return {
      kind: 'explicit',
      roleName: roleCandidate,
    };
  }

  return ABSENT_ROLE_ATTRIBUTION;
}
