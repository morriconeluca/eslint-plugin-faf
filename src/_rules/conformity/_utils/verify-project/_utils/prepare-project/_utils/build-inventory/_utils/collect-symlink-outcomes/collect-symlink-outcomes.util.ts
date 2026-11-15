import type { TOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function collectSymlinkOutcomes(
  items: readonly TInventoryItem[]
): readonly TOutcome[] {
  const outcomes: TOutcome[] = [];

  for (const item of items) {
    if (item.isSymlink && item.treeOrigin !== null) {
      outcomes.push(
        createOutcome.unverified('unverified/symbolic-link', {
          detail: item.realPath,
          element: item.path,
          reason: item.realPath,
        })
      );
    }
  }

  return outcomes;
}
