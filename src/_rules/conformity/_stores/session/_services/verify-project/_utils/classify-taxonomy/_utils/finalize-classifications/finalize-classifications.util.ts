import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TClassificationDraft } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { NODE_MASTER } from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { collectMasterIds } from './_utils/collect-master-ids/index.js';
import { collectParentCategoryIds } from './_utils/collect-parent-category-ids/index.js';

export function finalizeClassifications(
  drafts: ReadonlyMap<number, TClassificationDraft>,
  childrenByParentId: ReadonlyMap<number, readonly number[]>,
  mimeticPaths: ReadonlySet<string>
): readonly TItemClassification[] {
  const masterIds = collectMasterIds(drafts, childrenByParentId);
  const parentCategoryIds = collectParentCategoryIds(
    drafts,
    childrenByParentId,
    mimeticPaths
  );
  const classifications: TItemClassification[] = [];
  for (const draft of drafts.values()) {
    const nodeKind = masterIds.has(draft.itemId) ? NODE_MASTER : draft.nodeKind;
    classifications.push({
      domainKind: draft.domainKind,
      entryKind: draft.entryKind,
      fragmentInternalRank: draft.fragmentInternalRank,
      imposedRoleName: draft.imposedRoleName,
      itemId: draft.itemId,
      nodeKind,
      path: draft.path,
      relationalQualifications: {
        isParentCategory: parentCategoryIds.has(draft.itemId),
        isPathFragment: draft.isPathFragment,
        isPrivateCategory: draft.isPrivateCategory,
        isSubFragment: draft.isSubFragment,
        isSubLayer: draft.isSubLayer,
        parentFragmentPath: draft.parentFragmentPath,
      },
      role: draft.role,
    });
  }
  classifications.sort((left, right) => left.itemId - right.itemId);
  return classifications;
}
