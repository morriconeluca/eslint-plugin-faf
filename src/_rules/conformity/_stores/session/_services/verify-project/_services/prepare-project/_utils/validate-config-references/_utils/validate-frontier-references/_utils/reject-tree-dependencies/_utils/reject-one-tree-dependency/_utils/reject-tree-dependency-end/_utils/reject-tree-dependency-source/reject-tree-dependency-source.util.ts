import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TOwnedOrigin,
  TScopeBinding,
} from '../../../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_10,
  CONSTRAINT_TREE_DEPENDENCY_FROM_OUTSIDE_SCOPE,
  CONSTRAINT_TREE_DEPENDENCY_NOT_TREE_ORIGIN,
} from '../../../../../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';

export function rejectTreeDependencySource(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  owned: TOwnedOrigin | undefined,
  family: TConfigOutcome['family']
): readonly TConfigOutcome[] {
  if (owned === undefined) {
    return [
      {
        constraint: CONSTRAINT_TREE_DEPENDENCY_NOT_TREE_ORIGIN,
        element: path,
        family,
        message: `Tree dependency source "${path}" is not a tree origin of this configuration.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  if (scope.kind !== 'local') {
    return [];
  }
  if (owned.localIndex !== scope.localIndex) {
    return [
      {
        constraint: CONSTRAINT_TREE_DEPENDENCY_FROM_OUTSIDE_SCOPE,
        element: path,
        family,
        message: `Tree dependency source "${path}" does not belong to this local configuration.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  return [];
}
