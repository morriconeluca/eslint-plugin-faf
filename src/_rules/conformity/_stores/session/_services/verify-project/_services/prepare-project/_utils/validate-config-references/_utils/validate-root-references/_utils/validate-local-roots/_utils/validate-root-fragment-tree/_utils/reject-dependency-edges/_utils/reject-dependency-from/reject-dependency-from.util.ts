import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import {
  CONFIG_4,
  CONSTRAINT_INVALID_ROOT_DEPENDENCY_FROM,
} from '../../../../../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';

export function rejectDependencyFrom(
  fromNames: readonly string[],
  currentNames: ReadonlySet<string>,
  fragmentPath: string,
  edgePrefix: string
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  for (const [index, name] of fromNames.entries()) {
    if (!currentNames.has(name)) {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_ROOT_DEPENDENCY_FROM,
        element: name,
        family: 'configuration',
        message: `Root dependency source "${name}" is not an enumerated root node of "${fragmentPath}".`,
        normativeReference: CONFIG_4,
        propertyPath: `${edgePrefix}.from[${index}]`,
      });
    }
  }
  return outcomes;
}
