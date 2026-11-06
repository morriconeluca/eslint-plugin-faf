import type { TConfigOutcome } from '../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TOriginDirectoryCheck } from '../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function rejectOriginDirectory(
  check: TOriginDirectoryCheck
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
      createOutcome('configuration/expected-directory', {
        detail: `${check.label} "${check.path}" is not a resolved directory in the inventory.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  if (item.kind !== 'directory') {
    return [
      createOutcome('configuration/expected-directory', {
        detail: `${check.label} "${check.path}" must be a directory.`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  if (item.treeOrigin !== null && item.treeOrigin !== check.path) {
    return [
      createOutcome('configuration/origin-contained-in-other-tree', {
        detail: `${check.label} "${check.path}" is contained in tree "${item.treeOrigin}".`,
        element: check.path,
        propertyPath: check.propertyPath,
      }),
    ];
  }

  return [];
}
