import type { TConfigOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TInventoryItem } from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function rejectPublicRootNode(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const rejectItem = (item: TInventoryItem): readonly TConfigOutcome[] => {
    if (item.treeOrigin === null) {
      return [
        createOutcome.configuration('configuration/reference-outside-trees', {
          detail: `Public root node "${path}" must be inside a Fractal Tree of this configuration.`,
          element: path,
          propertyPath,
        }),
      ];
    }

    const owned = context.ownedOrigins.get(item.treeOrigin);
    if (owned === undefined && scope.kind === 'common') {
      return [
        createOutcome.configuration('configuration/reference-outside-trees', {
          detail: `Public root node "${path}" is outside the Fractal Trees of this configuration.`,
          element: path,
          propertyPath,
        }),
      ];
    }
    if (
      owned === undefined ||
      (scope.kind === 'local' && owned.localIndex !== scope.localIndex)
    ) {
      return [
        createOutcome.configuration(
          'configuration/reference-outside-local-scope',
          {
            detail: `Public root node "${path}" belongs to tree "${item.treeOrigin}" outside this local configuration.`,
            element: path,
            propertyPath,
          }
        ),
      ];
    }

    if (owned.originKind === 'root-layer') {
      return [
        createOutcome.configuration(
          'configuration/public-root-nodes-in-root-layer-tree',
          {
            element: path,
            propertyPath,
          }
        ),
      ];
    }

    if (!context.enumeratedRootNodes.has(path)) {
      return [
        createOutcome.configuration(
          'configuration/public-root-node-not-enumerated',
          {
            element: path,
            propertyPath,
          }
        ),
      ];
    }

    return [];
  };

  const id = context.inventory.pathToId.get(path);
  if (id === undefined) {
    return [
      createOutcome.configuration('configuration/non-existent-path', {
        detail: `Public root node "${path}" does not exist under configuration base "${context.baseDirectory}".`,
        element: path,
        propertyPath,
      }),
    ];
  }
  const item = context.inventory.items[id];
  if (item === undefined) {
    return [
      createOutcome.configuration('configuration/expected-file', {
        detail: `Public root node "${path}" is not a resolved file in the inventory.`,
        element: path,
        propertyPath,
      }),
    ];
  }
  if (item.kind !== 'file') {
    return [
      createOutcome.configuration('configuration/expected-file', {
        detail: `Public root node "${path}" must be a file.`,
        element: path,
        propertyPath,
      }),
    ];
  }

  return rejectItem(item);
}
