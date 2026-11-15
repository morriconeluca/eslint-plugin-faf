import type { TClassificationOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  THorizontalHierarchySet,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function collectMemberOutcomes(
  sets: readonly THorizontalHierarchySet[],
  taxonomy: TTaxonomyModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const reported = new Set<string>();

  for (const set of sets) {
    const parent = taxonomy.byPath.get(set.parentPath);
    const isUnclassified =
      parent === undefined ||
      (parent.entryKind === 'directory'
        ? parent.domainKind
        : parent.nodeKind) === null;
    if (isUnclassified || set.isOrderable || reported.has(set.parentPath)) {
      continue;
    }
    reported.add(set.parentPath);
    outcomes.push(
      createOutcome('classification/horizontal-hierarchy-members', {
        element: set.parentPath,
      })
    );
  }

  return outcomes;
}
