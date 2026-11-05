import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TProjectBasis } from '../../_verify-project@shared/_types/_aggregates/project-basis.type.js';
import type { TTaxonomyModel } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TPublicSurface } from '../../_verify-project@shared/_types/_compounds/public-surface.type.js';

import { notImplementedOutcome } from '../../_verify-project@shared/_utils/not-implemented-outcome/index.js';

export function derivePublicSurface(
  _basis: TProjectBasis,
  _taxonomy: TTaxonomyModel
): {
  readonly outcomes: readonly TOutcome[];
  readonly surface: TPublicSurface;
} {
  return {
    outcomes: [notImplementedOutcome('derive-public-surface', '§7.1')],
    surface: { trees: [] },
  };
}
