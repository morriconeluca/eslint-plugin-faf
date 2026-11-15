import type {
  TConfigConstraint,
  TConfigOutcome,
} from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { createOutcome } from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export const collectStringDuplicates = (
  items: readonly (
    | bigint
    | boolean
    | null
    | number
    | object
    | string
    | symbol
    | undefined
  )[],
  seen: Set<string>,
  pathAt: (index: number) => string,
  constraint: TConfigConstraint
): readonly TConfigOutcome[] => {
  const outcomes: TConfigOutcome[] = [];
  for (const [index, item] of items.entries()) {
    if (typeof item === 'string' && item.length > 0) {
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
