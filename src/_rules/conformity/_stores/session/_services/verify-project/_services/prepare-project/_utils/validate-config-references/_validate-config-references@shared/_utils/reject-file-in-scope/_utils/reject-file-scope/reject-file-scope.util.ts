import type { TConfigOutcome } from '../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TInventoryItem } from '../../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TFileReferenceCheck } from '../../../../_types/reference-context.type.js';

import {
  CONSTRAINT_REFERENCE_OUTSIDE_LOCAL_SCOPE,
  CONSTRAINT_REFERENCE_OUTSIDE_TREES,
} from '../../../../_constants/reference-constraints.constant.js';

export function rejectFileScope(
  check: TFileReferenceCheck,
  item: TInventoryItem,
  family: TConfigOutcome['family']
): readonly TConfigOutcome[] {
  if (item.treeOrigin === null) {
    return [
      {
        constraint: CONSTRAINT_REFERENCE_OUTSIDE_TREES,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" must be inside a Fractal Tree of this configuration.`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  const owned = check.context.ownedOrigins.get(item.treeOrigin);
  if (check.scope.kind === 'common') {
    if (owned !== undefined) {
      return [];
    }
    return [
      {
        constraint: CONSTRAINT_REFERENCE_OUTSIDE_TREES,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" is outside the Fractal Trees of this configuration.`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  if (owned !== undefined && owned.localIndex === check.scope.localIndex) {
    return [];
  }

  return [
    {
      constraint: CONSTRAINT_REFERENCE_OUTSIDE_LOCAL_SCOPE,
      element: check.path,
      family,
      message: `${check.label} "${check.path}" belongs to tree "${item.treeOrigin}" outside this local configuration.`,
      normativeReference: check.normativeReference,
      propertyPath: check.propertyPath,
    },
  ];
}
