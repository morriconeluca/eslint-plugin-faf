import type { TConfigOutcome } from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TInventoryItem } from '../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceScopeCheck } from './reject-reference-scope.type.js';

import { createOutcome } from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function rejectReferenceScope(
  check: TReferenceScopeCheck
): readonly TConfigOutcome[] {
  const rejectItemScope = (item: TInventoryItem): readonly TConfigOutcome[] => {
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
  };

  const expectedConstraint =
    check.expectedKind === 'directory'
      ? 'configuration/expected-directory'
      : 'configuration/expected-file';
  const id = check.context.inventory.pathToId.get(check.path);
  if (id === undefined) {
    return [
      createOutcome('configuration/non-existent-path', {
        detail: `${check.label} "${check.path}" does not exist under configuration base "${check.context.baseDirectory}".`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  const item = check.context.inventory.items[id];
  if (item === undefined) {
    return [
      createOutcome(expectedConstraint, {
        detail: `${check.label} "${check.path}" is not a resolved ${check.expectedKind} in the inventory.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  if (item.kind !== check.expectedKind) {
    return [
      createOutcome(expectedConstraint, {
        detail: `${check.label} "${check.path}" must be a ${check.expectedKind}.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  return rejectItemScope(item);
}
