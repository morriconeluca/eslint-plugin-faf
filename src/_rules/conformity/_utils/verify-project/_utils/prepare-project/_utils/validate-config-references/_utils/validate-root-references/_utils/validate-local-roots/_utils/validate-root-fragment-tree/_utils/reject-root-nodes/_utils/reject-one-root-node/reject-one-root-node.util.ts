import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { referenceScope } from '../../../../../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';
import { isDirectChildDirectory } from '../../../../_validate-root-fragment-tree@shared/_utils/is-direct-child-directory/index.js';

export function rejectOneRootNode(
  fragmentPath: string,
  name: string,
  propertyPath: string,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const fullPath = fragmentPath === '.' ? name : `${fragmentPath}/${name}`;
  const fileOutcomes = referenceScope.rejectFileInScope({
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
