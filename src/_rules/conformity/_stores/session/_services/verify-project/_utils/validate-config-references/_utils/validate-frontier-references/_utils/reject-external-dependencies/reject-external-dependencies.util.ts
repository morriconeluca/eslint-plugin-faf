import type { TFAFExternalDependency } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectExternalSource } from './_utils/reject-external-source/index.js';
import { rejectExternalTarget } from './_utils/reject-external-target/index.js';

export function rejectExternalDependencies(
  dependencies: readonly TFAFExternalDependency[],
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return dependencies.flatMap((dependency, index) => {
    const prefix = `${basePath}[${index}]`;
    return [
      ...dependency.from.flatMap((path, fromIndex) =>
        rejectExternalSource(
          path,
          `${prefix}.from[${fromIndex}]`,
          scope,
          context
        )
      ),
      ...dependency.to.flatMap((path, toIndex) =>
        rejectExternalTarget(path, `${prefix}.to[${toIndex}]`, context)
      ),
    ];
  });
}
