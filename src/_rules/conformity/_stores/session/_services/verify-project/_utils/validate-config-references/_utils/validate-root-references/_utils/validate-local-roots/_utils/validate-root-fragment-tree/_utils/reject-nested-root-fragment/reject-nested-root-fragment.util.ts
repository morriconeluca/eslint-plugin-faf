import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_4,
  CONSTRAINT_NESTED_ROOT_FRAGMENT_NOT_DIRECT_CHILD,
} from '../../../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
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
    normativeReference: CONFIG_4,
    path: childPath,
    propertyPath,
    scope: { kind: 'local', localIndex },
  });
  if (isDirectChildDirectory(context.inventory, childPath, parentPath)) {
    return directoryOutcomes;
  }

  return [
    ...directoryOutcomes,
    {
      constraint: CONSTRAINT_NESTED_ROOT_FRAGMENT_NOT_DIRECT_CHILD,
      element: childPath,
      family: 'configuration',
      message: `Nested root fragment "${childPath}" must be a direct child directory of "${parentPath}".`,
      normativeReference: CONFIG_4,
      propertyPath,
    },
  ];
}
