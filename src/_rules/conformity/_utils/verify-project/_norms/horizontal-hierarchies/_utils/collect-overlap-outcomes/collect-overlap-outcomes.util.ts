import type { TClassificationOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  THorizontalHierarchyConflict,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function collectOverlapOutcomes(
  conflicts: readonly THorizontalHierarchyConflict[],
  taxonomy: TTaxonomyModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const reported = new Set<string>();

  for (const conflict of conflicts) {
    const child = taxonomy.byItemId.get(conflict.itemId);
    const isUnclassified =
      child === undefined ||
      (child.entryKind === 'directory' ? child.domainKind : child.nodeKind) ===
        null;
    if (isUnclassified || reported.has(child.path)) {
      continue;
    }
    reported.add(child.path);
    outcomes.push(
      createOutcome('classification/horizontal-hierarchy-overlap', {
        element: child.path,
      })
    );
  }

  return outcomes;
}
