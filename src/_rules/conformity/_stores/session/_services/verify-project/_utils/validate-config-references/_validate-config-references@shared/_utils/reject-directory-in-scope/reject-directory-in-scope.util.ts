import type { TConfigOutcome } from '../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TDirectoryReferenceCheck } from '../../_types/reference-context.type.js';

import {
  CONSTRAINT_EXPECTED_DIRECTORY,
  CONSTRAINT_NON_EXISTENT_PATH,
} from '../../_constants/reference-constraints.constant.js';
import { rejectDirectoryScope } from './_utils/reject-directory-scope/index.js';

export function rejectDirectoryInScope(
  check: TDirectoryReferenceCheck
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

  return rejectDirectoryScope(check, item, family);
}
