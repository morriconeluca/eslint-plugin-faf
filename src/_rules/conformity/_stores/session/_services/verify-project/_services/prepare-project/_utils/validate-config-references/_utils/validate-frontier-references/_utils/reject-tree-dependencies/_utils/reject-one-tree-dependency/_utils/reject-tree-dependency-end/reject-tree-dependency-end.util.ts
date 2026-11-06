import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectTreeDependencySource } from './_utils/reject-tree-dependency-source/index.js';

export function rejectTreeDependencyEnd(
  path: string,
  propertyPath: string,
  role: 'source' | 'target',
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const id = context.inventory.pathToId.get(path);
  if (id === undefined) {
    return [
      createOutcome('configuration/non-existent-path', {
        detail: `Tree dependency ${role} "${path}" does not exist under configuration base "${context.baseDirectory}".`,
        element: path,
        propertyPath,
      }),
    ];
  }
  const item = context.inventory.items[id];
  if (item === undefined) {
    return [
      createOutcome('configuration/expected-directory', {
        detail: `Tree dependency ${role} "${path}" is not a resolved directory in the inventory.`,
        element: path,
        propertyPath,
      }),
    ];
  }
  if (item.kind !== 'directory') {
    return [
      createOutcome('configuration/expected-directory', {
        detail: `Tree dependency ${role} "${path}" must be a directory.`,
        element: path,
        propertyPath,
      }),
    ];
  }

  const owned = context.ownedOrigins.get(path);
  if (role === 'source') {
    return rejectTreeDependencySource(path, propertyPath, scope, owned);
  }
  if (owned !== undefined || item.treeOrigin === path) {
    return [];
  }
  return [
    createOutcome('configuration/tree-dependency-not-tree-origin', {
      element: path,
      propertyPath,
    }),
  ];
}
