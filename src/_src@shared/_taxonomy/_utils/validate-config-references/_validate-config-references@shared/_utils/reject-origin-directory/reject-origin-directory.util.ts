import type { TConfigOutcome } from '../../../../../../_domain/_types/outcome.type.js';
import type { TOriginDirectoryCheck } from '../../_types/reference-context.type.js';

import {
  CONSTRAINT_EXPECTED_DIRECTORY,
  CONSTRAINT_NON_EXISTENT_PATH,
  CONSTRAINT_ORIGIN_CONTAINED_IN_OTHER_TREE,
} from '../../_constants/reference-constraints.constant.js';

export function rejectOriginDirectory(
  check: TOriginDirectoryCheck
): readonly TConfigOutcome[] {
  const family = 'configuration' as const;
  const id = check.context.inventory.pathToId.get(check.path);
  if (id === undefined) {
    return [
      {
        constraint: CONSTRAINT_NON_EXISTENT_PATH,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" does not exist under configuration base "${check.context.baseDirectory}".`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  const item = check.context.inventory.items[id];
  if (item === undefined) {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_DIRECTORY,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" is not a resolved directory in the inventory.`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  if (item.kind !== 'directory') {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_DIRECTORY,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" must be a directory.`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  if (item.treeOrigin !== null && item.treeOrigin !== check.path) {
    return [
      {
        constraint: CONSTRAINT_ORIGIN_CONTAINED_IN_OTHER_TREE,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" is contained in tree "${item.treeOrigin}".`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  return [];
}
