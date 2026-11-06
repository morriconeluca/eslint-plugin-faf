import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function rejectDependencyFrom(
  fromNames: readonly string[],
  currentNames: ReadonlySet<string>,
  _fragmentPath: string,
  edgePrefix: string
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  for (const [index, name] of fromNames.entries()) {
    if (!currentNames.has(name)) {
      outcomes.push(
        createOutcome('configuration/invalid-root-dependency-from', {
          element: name,
          propertyPath: `${edgePrefix}.from[${index}]`,
        })
      );
    }
  }
  return outcomes;
}
