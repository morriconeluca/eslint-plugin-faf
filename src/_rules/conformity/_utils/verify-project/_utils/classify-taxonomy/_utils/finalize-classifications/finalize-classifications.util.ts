import type { TItemClassification } from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TClassificationDraft } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  DOMAIN_CATEGORY,
  DOMAIN_SUB_CATEGORY,
  FORM_FRAGMENTS,
  NODE_FRAGMENT,
  NODE_MASTER,
  ROLE_EXPLICIT,
} from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export const finalizeClassifications = (() => {
  const collectMasterIds = (
    drafts: ReadonlyMap<number, TClassificationDraft>,
    childrenByParentId: ReadonlyMap<number, readonly number[]>
  ): ReadonlySet<number> => {
    const masterIds = new Set<number>();
    for (const draft of drafts.values()) {
      const childIds = childrenByParentId.get(draft.itemId);
      if (childIds === undefined || draft.domainKind !== 'fragment') {
        continue;
      }
      const matches = childIds.filter((childId) => {
        const child = drafts.get(childId);
        return (
          child !== undefined &&
          child.role.kind === ROLE_EXPLICIT &&
          child.nodeKind === NODE_FRAGMENT &&
          child.role.roleName === draft.imposedRoleName
        );
      });
      if (matches.length === 1) {
        for (const onlyMatch of matches) {
          masterIds.add(onlyMatch);
        }
      }
    }
    return masterIds;
  };

  const collectParentCategoryIds = (
    drafts: ReadonlyMap<number, TClassificationDraft>,
    childrenByParentId: ReadonlyMap<number, readonly number[]>,
    mimeticPaths: ReadonlySet<string>
  ): ReadonlySet<number> => {
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
          return (
            child !== undefined && child.domainKind === DOMAIN_SUB_CATEGORY
          );
        });
      if (isMimeticParent || hasSubCategory) {
        parentCategoryIds.add(draft.itemId);
      }
    }
    return parentCategoryIds;
  };

  return function finalizeClassifications(
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
      const nodeKind = masterIds.has(draft.itemId)
        ? NODE_MASTER
        : draft.nodeKind;
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
  };
})();
