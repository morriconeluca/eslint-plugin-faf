import type { TConfigOutcome } from '../../../../../../../../../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_4,
  CONSTRAINT_INVALID_ROOT_DEPENDENCY_TO,
  CONSTRAINT_ROOT_DEPENDENCY_DIFFERENT_TREE,
  CONSTRAINT_ROOT_DEPENDENCY_SAME_FRAGMENT,
} from '../../../../../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';

export function rejectDependencyTo(
  toPaths: readonly string[],
  fragmentPath: string,
  treeOrigin: string,
  edgePrefix: string,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const family = 'configuration' as const;
  return toPaths.flatMap((toPath, index): readonly TConfigOutcome[] => {
    const propertyPath = `${edgePrefix}.to[${index}]`;
    const location = context.enumeratedRootNodes.get(toPath);
    if (location === undefined) {
      return [
        {
          constraint: CONSTRAINT_INVALID_ROOT_DEPENDENCY_TO,
          element: toPath,
          family,
          message: `Root dependency target "${toPath}" is not an enumerated root node.`,
          normativeReference: CONFIG_4,
          propertyPath,
        },
      ];
    }
    if (location.treeOrigin !== treeOrigin) {
      return [
        {
          constraint: CONSTRAINT_ROOT_DEPENDENCY_DIFFERENT_TREE,
          element: toPath,
          family,
          message: `Root dependency target "${toPath}" belongs to tree "${location.treeOrigin}", not "${treeOrigin}".`,
          normativeReference: CONFIG_4,
          propertyPath,
        },
      ];
    }
    if (location.rootFragmentPath === fragmentPath) {
      return [
        {
          constraint: CONSTRAINT_ROOT_DEPENDENCY_SAME_FRAGMENT,
          element: toPath,
          family,
          message: `Root dependency target "${toPath}" belongs to the same root fragment "${fragmentPath}".`,
          normativeReference: CONFIG_4,
          propertyPath,
        },
      ];
    }
    return [];
  });
}
