import type { TSourceLocation } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { compareSourceLocations } from '../../../../../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function sortByPosition<
  T extends { readonly position: TSourceLocation },
>(items: readonly T[]): readonly T[] {
  const elements = [...items];
  elements.sort((first, second) =>
    compareSourceLocations(first.position, second.position)
  );
  return elements;
}
