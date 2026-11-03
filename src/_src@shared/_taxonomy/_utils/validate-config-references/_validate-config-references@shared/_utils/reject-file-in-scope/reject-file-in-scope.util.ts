import type { TConfigOutcome } from '../../../../../../_domain/_types/outcome.type.js';
import type { TFileReferenceCheck } from '../../_types/reference-context.type.js';

import {
  CONSTRAINT_EXPECTED_FILE,
  CONSTRAINT_NON_EXISTENT_PATH,
} from '../../_constants/reference-constraints.constant.js';
import { rejectFileScope } from './_utils/reject-file-scope/index.js';

export function rejectFileInScope(
  check: TFileReferenceCheck
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
        constraint: CONSTRAINT_EXPECTED_FILE,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" is not a resolved file in the inventory.`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  if (item.kind !== 'file') {
    return [
      {
        constraint: CONSTRAINT_EXPECTED_FILE,
        element: check.path,
        family,
        message: `${check.label} "${check.path}" must be a file.`,
        normativeReference: check.normativeReference,
        propertyPath: check.propertyPath,
      },
    ];
  }

  return rejectFileScope(check, item, family);
}
