import type { TConfigOutcome } from '../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function rejectPublicRootNode(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const id = context.inventory.pathToId.get(path);
  if (id === undefined) {
    return [
      createOutcome('configuration/non-existent-path', {
        detail: `Public root node "${path}" does not exist under configuration base "${context.baseDirectory}".`,
        element: path,
        propertyPath,
      }),
    ];
  }
  const item = context.inventory.items[id];
  if (item === undefined) {
    return [
      createOutcome('configuration/expected-file', {
        detail: `Public root node "${path}" is not a resolved file in the inventory.`,
        element: path,
        propertyPath,
      }),
    ];
  }
  if (item.kind !== 'file') {
    return [
      createOutcome('configuration/expected-file', {
        detail: `Public root node "${path}" must be a file.`,
        element: path,
        propertyPath,
      }),
    ];
  }

  const location = context.enumeratedRootNodes.get(path);
  if (location === undefined) {
    return [
      createOutcome('configuration/public-root-node-not-enumerated', {
        element: path,
        propertyPath,
      }),
    ];
  }
  if (scope.kind === 'common') {
    return [];
  }

  const owned = context.ownedOrigins.get(location.treeOrigin);
  if (owned !== undefined && owned.localIndex === scope.localIndex) {
    return [];
  }
  return [
    createOutcome('configuration/reference-outside-local-scope', {
      detail: `Public root node "${path}" belongs to tree "${location.treeOrigin}" outside this local configuration.`,
      element: path,
      propertyPath,
    }),
  ];
}
