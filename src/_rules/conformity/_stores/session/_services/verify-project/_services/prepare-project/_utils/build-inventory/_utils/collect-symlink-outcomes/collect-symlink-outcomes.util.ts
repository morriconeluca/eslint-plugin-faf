import type { TOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function collectSymlinkOutcomes(
  items: readonly TInventoryItem[]
): readonly TOutcome[] {
  const outcomes: TOutcome[] = [];

  for (const item of items) {
    if (item.isSymlink && item.treeOrigin !== null) {
      outcomes.push(
        createOutcome('unverified/symbolic-link', {
          detail: item.realPath,
          element: item.path,
          reason: item.realPath,
        })
      );
    }
  }

  return outcomes;
}
