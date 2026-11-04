import type { TFAFTreeDependency } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectOneTreeDependency } from './_utils/reject-one-tree-dependency/index.js';

export function rejectTreeDependencies(
  dependencies: readonly TFAFTreeDependency[],
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return dependencies.flatMap((dependency, index) =>
    rejectOneTreeDependency(dependency, `${basePath}[${index}]`, scope, context)
  );
}
