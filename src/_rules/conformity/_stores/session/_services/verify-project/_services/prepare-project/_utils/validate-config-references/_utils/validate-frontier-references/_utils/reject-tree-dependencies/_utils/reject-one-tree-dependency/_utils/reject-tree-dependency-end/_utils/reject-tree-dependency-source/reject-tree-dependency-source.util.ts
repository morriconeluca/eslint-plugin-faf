import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TOwnedOrigin,
  TScopeBinding,
} from '../../../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function rejectTreeDependencySource(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  owned: TOwnedOrigin | undefined,
  _family?: TConfigOutcome['family']
): readonly TConfigOutcome[] {
  if (owned === undefined) {
    return [
      createOutcome('configuration/tree-dependency-not-tree-origin', {
        element: path,
        propertyPath,
      }),
    ];
  }
  if (scope.kind !== 'local') {
    return [];
  }
  if (owned.localIndex !== scope.localIndex) {
    return [
      createOutcome('configuration/tree-dependency-from-outside-scope', {
        element: path,
        propertyPath,
      }),
    ];
  }
  return [];
}
