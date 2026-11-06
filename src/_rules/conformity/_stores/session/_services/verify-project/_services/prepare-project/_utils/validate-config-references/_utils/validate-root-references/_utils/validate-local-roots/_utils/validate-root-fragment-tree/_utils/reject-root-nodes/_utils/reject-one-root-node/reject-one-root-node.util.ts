import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectFileInScope } from '../../../../../../../../../../_validate-config-references@shared/_utils/reject-file-in-scope/index.js';
import { isDirectChildDirectory } from '../../../../_validate-root-fragment-tree@shared/_utils/is-direct-child-directory/index.js';

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
    path: fullPath,
    propertyPath,
    scope: { kind: 'local', localIndex },
  });
  if (isDirectChildDirectory(context.inventory, fullPath, fragmentPath)) {
    return fileOutcomes;
  }

  return [
    ...fileOutcomes,
    createOutcome('configuration/root-node-not-direct-child', {
      element: fullPath,
      propertyPath,
    }),
  ];
}
