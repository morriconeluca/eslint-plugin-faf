import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { isAliasReference } from './_utils/is-alias-reference/index.js';
import { isLibraryPath } from './_utils/is-library-path/index.js';

export function rejectExternalTarget(
  path: string,
  propertyPath: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  if (isAliasReference(path, context.aliasPrefixes)) {
    return [
      createOutcome('configuration/external-dependency-to-alias', {
        element: path,
        propertyPath,
      }),
    ];
  }
  if (isLibraryPath(path)) {
    return [
      createOutcome('configuration/external-dependency-to-library', {
        element: path,
        propertyPath,
      }),
    ];
  }

  const id = context.inventory.pathToId.get(path);
  if (id === undefined) {
    return [
      createOutcome('configuration/non-existent-path', {
        detail: `External dependency target "${path}" does not exist under configuration base "${context.baseDirectory}".`,
        element: path,
        propertyPath,
      }),
    ];
  }
  const item = context.inventory.items[id];
  if (item === undefined) {
    return [
      createOutcome('configuration/expected-file', {
        detail: `External dependency target "${path}" is not a resolved file in the inventory.`,
        element: path,
        propertyPath,
      }),
    ];
  }
  if (item.kind !== 'file') {
    return [
      createOutcome('configuration/expected-file', {
        detail: `External dependency target "${path}" must be a file.`,
        element: path,
        propertyPath,
      }),
    ];
  }
  if (item.treeOrigin !== null) {
    return [
      createOutcome('configuration/external-dependency-to-inside-tree', {
        element: path,
        propertyPath,
      }),
    ];
  }
  return [];
}
