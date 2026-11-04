import type { TClassificationDraft } from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  NODE_FRAGMENT,
  ROLE_EXPLICIT,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function collectMasterIds(
  drafts: ReadonlyMap<number, TClassificationDraft>,
  childrenByParentId: ReadonlyMap<number, readonly number[]>
): ReadonlySet<number> {
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
}
