import type { TConfigOutcome } from '../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TInventoryItem } from '../../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TFileReferenceCheck } from '../../../../_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function rejectFileScope(
  check: TFileReferenceCheck,
  item: TInventoryItem,
  _family?: TConfigOutcome['family']
): readonly TConfigOutcome[] {
  if (item.treeOrigin === null) {
    return [
      createOutcome('configuration/reference-outside-trees', {
        detail: `${check.label} "${check.path}" must be inside a Fractal Tree of this configuration.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  const owned = check.context.ownedOrigins.get(item.treeOrigin);
  if (check.scope.kind === 'common') {
    if (owned !== undefined) {
      return [];
    }
    return [
      createOutcome('configuration/reference-outside-trees', {
        detail: `${check.label} "${check.path}" is outside the Fractal Trees of this configuration.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  if (owned !== undefined && owned.localIndex === check.scope.localIndex) {
    return [];
  }

  return [
    createOutcome('configuration/reference-outside-local-scope', {
      detail: `${check.label} "${check.path}" belongs to tree "${item.treeOrigin}" outside this local configuration.`,
      element: check.path,
      propertyPath: check.propertyPath,
    }),
  ];
}
