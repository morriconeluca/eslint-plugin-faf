import type { TConfigOutcome } from '../../../../../../_domain/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../_types/reference-context.type.js';

import {
  CONFIG_5,
  CONFIG_10,
  CONSTRAINT_EXPECTED_FILE,
  CONSTRAINT_NON_EXISTENT_PATH,
  CONSTRAINT_PUBLIC_ROOT_NODE_NOT_ENUMERATED,
  CONSTRAINT_REFERENCE_OUTSIDE_LOCAL_SCOPE,
} from '../../_constants/reference-constraints.constant.js';

export function rejectPublicRootNode(
  path: string,
  propertyPath: string,
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
        message: `Public root node "${path}" does not exist under configuration base "${context.baseDirectory}".`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  const item = context.inventory.items[id];
  if (item === undefined) {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_FILE,
        element: path,
        family,
        message: `Public root node "${path}" is not a resolved file in the inventory.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  if (item.kind !== 'file') {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_FILE,
        element: path,
        family,
        message: `Public root node "${path}" must be a file.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }

  const location = context.enumeratedRootNodes.get(path);
  if (location === undefined) {
    return [
      {
        constraint: CONSTRAINT_PUBLIC_ROOT_NODE_NOT_ENUMERATED,
        element: path,
        family,
        message: `Public root node "${path}" is not an enumerated root node.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
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
    {
      constraint: CONSTRAINT_REFERENCE_OUTSIDE_LOCAL_SCOPE,
      element: path,
      family,
      message: `Public root node "${path}" belongs to tree "${location.treeOrigin}" outside this local configuration.`,
      normativeReference: CONFIG_5,
      propertyPath,
    },
  ];
}
