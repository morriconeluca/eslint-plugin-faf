import type { TClassificationOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  THorizontalHierarchyConflict,
  THorizontalHierarchySet,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';

const isUnclassified = (
  classification: ReturnType<TTaxonomyModel['byPath']['get']>
): boolean =>
  classification === undefined ||
  (classification.entryKind === 'directory'
    ? classification.domainKind
    : classification.nodeKind) === null;

export function collectMemberOutcomes(
  sets: readonly THorizontalHierarchySet[],
  taxonomy: TTaxonomyModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const reported = new Set<string>();

  for (const set of sets) {
    const parent = taxonomy.byPath.get(set.parentPath);
    if (
      isUnclassified(parent) ||
      set.isOrderable ||
      reported.has(set.parentPath)
    ) {
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

export function collectOverlapOutcomes(
  conflicts: readonly THorizontalHierarchyConflict[],
  taxonomy: TTaxonomyModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const reported = new Set<string>();

  for (const conflict of conflicts) {
    const child = taxonomy.byItemId.get(conflict.itemId);
    if (
      child === undefined ||
      isUnclassified(child) ||
      reported.has(child.path)
    ) {
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
