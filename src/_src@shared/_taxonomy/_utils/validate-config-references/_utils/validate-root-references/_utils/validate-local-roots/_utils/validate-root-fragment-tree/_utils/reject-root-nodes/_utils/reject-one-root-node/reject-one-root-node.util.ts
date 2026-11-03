import type { TConfigOutcome } from '../../../../../../../../../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_4,
  CONSTRAINT_ROOT_NODE_NOT_DIRECT_CHILD,
} from '../../../../../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { isDirectChildDirectory } from '../../../../../../../../../../_validate-config-references@shared/_utils/is-direct-child-directory/index.js';
import { rejectFileInScope } from '../../../../../../../../../../_validate-config-references@shared/_utils/reject-file-in-scope/index.js';

export function rejectOneRootNode(
  fragmentPath: string,
  name: string,
  propertyPath: string,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const fullPath = fragmentPath === '.' ? name : `${fragmentPath}/${name}`;
  const fileOutcomes = rejectFileInScope({
    context,
    label: 'Root node',
    normativeReference: CONFIG_4,
    path: fullPath,
    propertyPath,
    scope: { kind: 'local', localIndex },
  });
  if (isDirectChildDirectory(context.inventory, fullPath, fragmentPath)) {
    return fileOutcomes;
  }

  return [
    ...fileOutcomes,
    {
      constraint: CONSTRAINT_ROOT_NODE_NOT_DIRECT_CHILD,
      element: fullPath,
      family: 'configuration',
      message: `Root node "${fullPath}" must be a direct child file of "${fragmentPath}".`,
      normativeReference: CONFIG_4,
      propertyPath,
    },
  ];
}
