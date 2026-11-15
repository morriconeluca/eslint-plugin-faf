import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../../../../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function rejectDependencyTo(
  toPaths: readonly string[],
  fragmentPath: string,
  treeOrigin: string,
  edgePrefix: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return toPaths.flatMap((toPath, index): readonly TConfigOutcome[] => {
    const propertyPath = `${edgePrefix}.to[${index}]`;
    const location = context.enumeratedRootNodes.get(toPath);
    if (location === undefined) {
      return [
        createOutcome('configuration/invalid-root-dependency-to', {
          element: toPath,
          propertyPath,
        }),
      ];
    }
    if (location.treeOrigin !== treeOrigin) {
      return [
        createOutcome('configuration/root-dependency-different-tree', {
          detail: `Root dependency target "${toPath}" belongs to tree "${location.treeOrigin}", not "${treeOrigin}".`,
          element: toPath,
          propertyPath,
        }),
      ];
    }
    if (location.rootFragmentPath === fragmentPath) {
      return [
        createOutcome('configuration/root-dependency-same-fragment', {
          detail: `Root dependency target "${toPath}" belongs to the same root fragment "${fragmentPath}".`,
          element: toPath,
          propertyPath,
        }),
      ];
    }
    return [];
  });
}
