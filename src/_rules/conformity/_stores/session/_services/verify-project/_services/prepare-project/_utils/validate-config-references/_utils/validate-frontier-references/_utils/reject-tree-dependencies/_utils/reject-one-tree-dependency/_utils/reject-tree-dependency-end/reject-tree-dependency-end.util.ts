import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_10,
  CONSTRAINT_EXPECTED_DIRECTORY,
  CONSTRAINT_NON_EXISTENT_PATH,
  CONSTRAINT_TREE_DEPENDENCY_NOT_TREE_ORIGIN,
} from '../../../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectTreeDependencySource } from './_utils/reject-tree-dependency-source/index.js';

export function rejectTreeDependencyEnd(
  path: string,
  propertyPath: string,
  role: 'source' | 'target',
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const family = 'configuration' as const;
  const id = context.inventory.pathToId.get(path);
  if (id === undefined) {
    return [
      {
        constraint: CONSTRAINT_NON_EXISTENT_PATH,
        element: path,
        family,
        message: `Tree dependency ${role} "${path}" does not exist under configuration base "${context.baseDirectory}".`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  const item = context.inventory.items[id];
  if (item === undefined) {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_DIRECTORY,
        element: path,
        family,
        message: `Tree dependency ${role} "${path}" is not a resolved directory in the inventory.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  if (item.kind !== 'directory') {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_DIRECTORY,
        element: path,
        family,
        message: `Tree dependency ${role} "${path}" must be a directory.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }

  const owned = context.ownedOrigins.get(path);
  if (role === 'source') {
    return rejectTreeDependencySource(path, propertyPath, scope, owned, family);
  }
  if (owned !== undefined || item.treeOrigin === path) {
    return [];
  }
  return [
    {
      constraint: CONSTRAINT_TREE_DEPENDENCY_NOT_TREE_ORIGIN,
      element: path,
      family,
      message: `Tree dependency target "${path}" is not a tree origin.`,
      normativeReference: CONFIG_10,
      propertyPath,
    },
  ];
}
