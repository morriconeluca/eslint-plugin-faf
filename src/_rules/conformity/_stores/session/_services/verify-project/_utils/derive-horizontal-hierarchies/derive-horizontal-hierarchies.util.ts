import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type { TTaxonomyModel } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { THorizontalHierarchies } from '../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

import { notImplementedOutcome } from '../../_verify-project@shared/_utils/not-implemented-outcome/index.js';

export function deriveHorizontalHierarchies(
  _basis: TProjectBasis,
  _taxonomy: TTaxonomyModel
): {
  readonly hierarchies: THorizontalHierarchies;
  readonly outcomes: readonly TOutcome[];
} {
  return {
    hierarchies: { sets: [] },
    outcomes: [
      notImplementedOutcome(
        'derive-horizontal-hierarchies',
        '§4, §6.3.4, §6.9'
      ),
    ],
  };
}
