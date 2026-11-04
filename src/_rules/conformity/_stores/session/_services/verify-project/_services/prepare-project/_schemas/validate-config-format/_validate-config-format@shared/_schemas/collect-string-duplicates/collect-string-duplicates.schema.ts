import type { TConfigOutcome } from '../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

export const collectStringDuplicates = (
  items: readonly unknown[],
  seen: Set<string>,
  pathAt: (index: number) => string,
  message: (value: string) => string,
  normativeReference: string,
  constraint: `configuration/${string}`
): readonly TConfigOutcome[] => {
  const outcomes: TConfigOutcome[] = [];
  for (const [index, item] of items.entries()) {
    if (typeof item === 'string' && item.length > 0) {
      if (seen.has(item)) {
        const propertyPath = pathAt(index);
        outcomes.push({
          constraint,
          element: propertyPath,
          family: 'configuration',
          message: message(item),
          normativeReference,
          propertyPath,
        });
      } else {
        seen.add(item);
      }
    }
  }
  return outcomes;
};
