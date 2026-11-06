import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectDirectoryInScope } from '../../../../../../../../_validate-config-references@shared/_utils/reject-directory-in-scope/index.js';
import { isDirectChildDirectory } from '../../_validate-root-fragment-tree@shared/_utils/is-direct-child-directory/index.js';

export function rejectNestedRootFragment(
  childPath: string,
  parentPath: string,
  propertyPath: string,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const directoryOutcomes = rejectDirectoryInScope({
    context,
    label: 'Nested root fragment',
    path: childPath,
    propertyPath,
    scope: { kind: 'local', localIndex },
  });
  if (isDirectChildDirectory(context.inventory, childPath, parentPath)) {
    return directoryOutcomes;
  }

  return [
    ...directoryOutcomes,
    createOutcome('configuration/nested-root-fragment-not-direct-child', {
      element: childPath,
      propertyPath,
    }),
  ];
}
