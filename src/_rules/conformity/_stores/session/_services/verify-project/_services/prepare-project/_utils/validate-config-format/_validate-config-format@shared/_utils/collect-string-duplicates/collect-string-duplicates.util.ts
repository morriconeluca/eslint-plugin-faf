import type {
  TConfigConstraint,
  TConfigOutcome,
} from '../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { formFields } from '../../_schemas/form-fields/index.js';

export const collectStringDuplicates = (
  items: readonly unknown[],
  seen: Set<string>,
  pathAt: (index: number) => string,
  constraint: TConfigConstraint
): readonly TConfigOutcome[] => {
  const outcomes: TConfigOutcome[] = [];
  for (const [index, item] of items.entries()) {
    if (formFields.isNonEmptyString(item)) {
      if (seen.has(item)) {
        const propertyPath = pathAt(index);
        outcomes.push(
          createOutcome(constraint, {
            propertyPath,
          })
        );
      } else {
        seen.add(item);
      }
    }
  }
  return outcomes;
};
