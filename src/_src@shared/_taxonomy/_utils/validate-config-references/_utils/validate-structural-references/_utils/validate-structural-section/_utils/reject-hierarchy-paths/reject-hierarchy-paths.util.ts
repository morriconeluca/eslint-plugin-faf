import type { TFAFLocalHorizontalHierarchy } from '../../../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../_domain/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { CONFIG_7 } from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectDirectoryInScope } from '../../../../../../_validate-config-references@shared/_utils/reject-directory-in-scope/index.js';

export function rejectHierarchyPaths(
  hierarchies: readonly TFAFLocalHorizontalHierarchy[],
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return hierarchies.flatMap((entry, entryIndex) =>
    entry.paths.flatMap((path, pathIndex) =>
      rejectDirectoryInScope({
        context,
        label: 'Hierarchy directory',
        normativeReference: CONFIG_7,
        path,
        propertyPath: `${basePath}[${entryIndex}].paths[${pathIndex}]`,
        scope,
      })
    )
  );
}
