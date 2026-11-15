import type { TSourceLocation } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { compareSourceLocations } from '../../../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function dedupeSourceLocations(
  locations: readonly TSourceLocation[]
): readonly TSourceLocation[] {
  const sorted = [...locations];
  sorted.sort(compareSourceLocations);
  const deduped: TSourceLocation[] = [];

  for (const position of sorted) {
    const last = deduped.at(-1);
    if (last === undefined || compareSourceLocations(last, position) !== 0) {
      deduped.push(position);
    }
  }

  return deduped;
}
