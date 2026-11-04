import { describe, expect, it } from 'vitest';

import type { TClassificationDraft } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { finalizeClassifications } from './finalize-classifications.util.js';

const draft = (itemId: number): TClassificationDraft => ({
  domainKind: 'layer',
  entryKind: 'directory',
  form: null,
  fragmentInternalRank: null,
  imposedRoleName: null,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  itemId,
  nodeKind: null,
  parentFragmentPath: null,
  path: `src/${itemId}`,
  role: { kind: 'absent', roleName: null },
});

describe('finalizeClassifications', () => {
  it('returns classifications ordered by item id regardless of draft insertion order', () => {
    const drafts = new Map<number, TClassificationDraft>();
    for (const itemId of [3, 1, 2]) {
      drafts.set(itemId, draft(itemId));
    }
    const result = finalizeClassifications(drafts, new Map(), new Set());
    expect(result.map((classification) => classification.itemId)).toEqual([
      1, 2, 3,
    ]);
    expect(result[0]?.relationalQualifications.isParentCategory).toBe(false);
    expect(result[0]?.nodeKind).toBeNull();
  });
});
