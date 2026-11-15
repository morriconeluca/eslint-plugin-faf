import type { TClassificationDraft } from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_CATEGORY,
  DOMAIN_SUB_CATEGORY,
  FORM_FRAGMENTS,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function collectParentCategoryIds(
  drafts: ReadonlyMap<number, TClassificationDraft>,
  childrenByParentId: ReadonlyMap<number, readonly number[]>,
  mimeticPaths: ReadonlySet<string>
): ReadonlySet<number> {
  const parentCategoryIds = new Set<number>();
  for (const draft of drafts.values()) {
    if (draft.domainKind !== DOMAIN_CATEGORY) {
      continue;
    }
    const isMimeticParent =
      draft.form === FORM_FRAGMENTS && mimeticPaths.has(draft.path);
    const childIds = childrenByParentId.get(draft.itemId);
    const hasSubCategory =
      childIds !== undefined &&
      childIds.some((childId) => {
        const child = drafts.get(childId);
        return child !== undefined && child.domainKind === DOMAIN_SUB_CATEGORY;
      });
    if (isMimeticParent || hasSubCategory) {
      parentCategoryIds.add(draft.itemId);
    }
  }
  return parentCategoryIds;
}
