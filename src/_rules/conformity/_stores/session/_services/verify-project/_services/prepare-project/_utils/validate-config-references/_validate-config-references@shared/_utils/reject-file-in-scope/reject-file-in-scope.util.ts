import type { TConfigOutcome } from '../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TFileReferenceCheck } from '../../_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectFileScope } from './_utils/reject-file-scope/index.js';

export function rejectFileInScope(
  check: TFileReferenceCheck
): readonly TConfigOutcome[] {
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
      createOutcome('configuration/expected-file', {
        detail: `${check.label} "${check.path}" is not a resolved file in the inventory.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  if (item.kind !== 'file') {
    return [
      createOutcome('configuration/expected-file', {
        detail: `${check.label} "${check.path}" must be a file.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  return rejectFileScope(check, item);
}
