import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { rejectReferenceScope } from '../../../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';
import { isDirectChildDirectory } from '../../_validate-root-fragment-tree@shared/_utils/is-direct-child-directory/index.js';

export function rejectNestedRootFragment(
  childPath: string,
  parentPath: string,
  propertyPath: string,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const directoryOutcomes = rejectReferenceScope({
    context,
    expectedKind: 'directory',
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
    createOutcome.configuration(
      'configuration/nested-root-fragment-not-direct-child',
      {
        element: childPath,
        propertyPath,
      }
    ),
  ];
}
