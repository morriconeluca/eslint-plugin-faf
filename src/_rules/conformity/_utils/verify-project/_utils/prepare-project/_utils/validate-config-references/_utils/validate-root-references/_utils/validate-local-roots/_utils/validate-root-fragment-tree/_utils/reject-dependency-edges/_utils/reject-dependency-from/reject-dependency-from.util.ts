import type { TConfigOutcome } from '../../../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

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
