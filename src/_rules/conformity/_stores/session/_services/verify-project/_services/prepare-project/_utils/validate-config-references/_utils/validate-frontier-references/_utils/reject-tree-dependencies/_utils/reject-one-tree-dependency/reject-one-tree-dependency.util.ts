import type { TFAFTreeDependency } from '../../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectTreeDependencyEnd } from './_utils/reject-tree-dependency-end/index.js';

export function rejectOneTreeDependency(
  dependency: TFAFTreeDependency,
  prefix: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const fromOutcomes = dependency.from.flatMap((path, index) =>
    rejectTreeDependencyEnd(
      path,
      `${prefix}.from[${index}]`,
      'source',
      scope,
      context
    )
  );
  const toOutcomes = dependency.to.flatMap((path, index) =>
    rejectTreeDependencyEnd(
      path,
      `${prefix}.to[${index}]`,
      'target',
      scope,
      context
    )
  );
  const selfOutcomes: TConfigOutcome[] = [];
  for (const [index, path] of dependency.to.entries()) {
    if (dependency.from.includes(path)) {
      selfOutcomes.push(
        createOutcome('configuration/tree-dependency-self', {
          element: path,
          propertyPath: `${prefix}.to[${index}]`,
        })
      );
    }
  }
  return [...fromOutcomes, ...toOutcomes, ...selfOutcomes];
}
