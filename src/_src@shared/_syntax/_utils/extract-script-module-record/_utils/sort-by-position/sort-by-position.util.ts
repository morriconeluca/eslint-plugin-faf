import type { TSourceLocation } from '../../../../../_domain/_types/outcome.type.js';

import { compareSourceLocations } from '../../../../../_domain/_utils/compare-source-locations/index.js';

export function sortByPosition<
  T extends { readonly position: TSourceLocation },
>(items: readonly T[]): readonly T[] {
  const elements = [...items];
  elements.sort((first, second) =>
    compareSourceLocations(first.position, second.position)
  );
  return elements;
}
