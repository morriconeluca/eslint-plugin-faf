import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_10,
  CONSTRAINT_EXPECTED_FILE,
  CONSTRAINT_EXTERNAL_DEPENDENCY_TO_ALIAS,
  CONSTRAINT_EXTERNAL_DEPENDENCY_TO_INSIDE_TREE,
  CONSTRAINT_EXTERNAL_DEPENDENCY_TO_LIBRARY,
  CONSTRAINT_NON_EXISTENT_PATH,
} from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { isAliasReference } from './_utils/is-alias-reference/index.js';
import { isLibraryPath } from './_utils/is-library-path/index.js';

export function rejectExternalTarget(
  path: string,
  propertyPath: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const family = 'configuration' as const;
  if (isAliasReference(path, context.aliasPrefixes)) {
    return [
      {
        constraint: CONSTRAINT_EXTERNAL_DEPENDENCY_TO_ALIAS,
        element: path,
        family,
        message: `External dependency target "${path}" is a path alias, not a punctual file.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  if (isLibraryPath(path)) {
    return [
      {
        constraint: CONSTRAINT_EXTERNAL_DEPENDENCY_TO_LIBRARY,
        element: path,
        family,
        message: `External dependency target "${path}" is a library path inside node_modules.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }

  const id = context.inventory.pathToId.get(path);
  if (id === undefined) {
    return [
      {
        constraint: CONSTRAINT_NON_EXISTENT_PATH,
        element: path,
        family,
        message: `External dependency target "${path}" does not exist under configuration base "${context.baseDirectory}".`,
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
        message: `External dependency target "${path}" is not a resolved file in the inventory.`,
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
        message: `External dependency target "${path}" must be a file.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  if (item.treeOrigin !== null) {
    return [
      {
        constraint: CONSTRAINT_EXTERNAL_DEPENDENCY_TO_INSIDE_TREE,
        element: path,
        family,
        message: `External dependency target "${path}" must be outside all Fractal Trees.`,
        normativeReference: CONFIG_10,
        propertyPath,
      },
    ];
  }
  return [];
}
