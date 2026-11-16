import { describe, expect, it } from 'vitest';

import type { TClassificationDraft } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { finalizeClassifications } from './finalize-classifications.util.js';

const draft = (
  itemId: number,
  overrides: Partial<TClassificationDraft> = {}
): TClassificationDraft => ({
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
  ...overrides,
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

  it('promotes unique explicit Fragment Node matching the Fragment Role to Master Node', () => {
    const drafts = new Map<number, TClassificationDraft>([
      [
        1,
        draft(1, {
          domainKind: 'fragment',
          imposedRoleName: 'component',
          path: 'src/button',
        }),
      ],
      [
        2,
        draft(2, {
          domainKind: null,
          entryKind: 'file',
          imposedRoleName: 'component',
          nodeKind: 'fragment-node',
          parentFragmentPath: 'src/button',
          path: 'src/button/button.component.tsx',
          role: { kind: 'explicit', roleName: 'component' },
        }),
      ],
      [
        3,
        draft(3, {
          domainKind: null,
          entryKind: 'file',
          imposedRoleName: 'component',
          nodeKind: 'fragment-node',
          parentFragmentPath: 'src/button',
          path: 'src/button/button.hook.ts',
          role: { kind: 'explicit', roleName: 'hook' },
        }),
      ],
    ]);
    const result = finalizeClassifications(
      drafts,
      new Map([[1, [2, 3, 99]]]),
      new Set()
    );
    expect(result.find((item) => item.itemId === 2)?.nodeKind).toBe(
      'master-node'
    );
    expect(result.find((item) => item.itemId === 3)?.nodeKind).toBe(
      'fragment-node'
    );
  });

  it('does not promote duplicate, implicit, or non-fragment-node candidates', () => {
    const drafts = new Map<number, TClassificationDraft>([
      [
        1,
        draft(1, {
          domainKind: 'fragment',
          imposedRoleName: 'component',
          path: 'src/dup',
        }),
      ],
      [
        2,
        draft(2, {
          domainKind: null,
          entryKind: 'file',
          nodeKind: 'fragment-node',
          role: { kind: 'explicit', roleName: 'component' },
        }),
      ],
      [
        3,
        draft(3, {
          domainKind: null,
          entryKind: 'file',
          nodeKind: 'fragment-node',
          role: { kind: 'explicit', roleName: 'component' },
        }),
      ],
      [
        4,
        draft(4, {
          domainKind: 'fragment',
          imposedRoleName: 'style',
          path: 'src/imp',
        }),
      ],
      [
        5,
        draft(5, {
          domainKind: null,
          entryKind: 'file',
          nodeKind: 'fragment-node',
          role: { kind: 'implicit', roleName: 'style' },
        }),
      ],
      [
        6,
        draft(6, {
          domainKind: null,
          entryKind: 'file',
          nodeKind: 'category-node',
          role: { kind: 'explicit', roleName: 'style' },
        }),
      ],
    ]);
    const result = finalizeClassifications(
      drafts,
      new Map([
        [1, [2, 3]],
        [4, [5, 6]],
      ]),
      new Set()
    );
    expect(result.some((item) => item.nodeKind === 'master-node')).toBe(false);
  });

  it('marks Parent Categories for Sub-Categories and mimetic Fragments Categories only', () => {
    const drafts = new Map<number, TClassificationDraft>([
      [
        1,
        draft(1, {
          domainKind: 'category',
          form: 'fragments',
          path: 'src/_components',
        }),
      ],
      [
        2,
        draft(2, {
          domainKind: 'sub-category',
          form: 'fragments',
          path: 'src/_components/_atoms',
        }),
      ],
      [
        3,
        draft(3, {
          domainKind: 'category',
          form: 'fragments',
          path: 'src/_apis',
        }),
      ],
      [
        4,
        draft(4, {
          domainKind: 'category',
          form: 'category-nodes',
          path: 'src/_types',
        }),
      ],
    ]);
    const result = finalizeClassifications(
      drafts,
      new Map([
        [1, [2, 99]],
        [3, []],
        [4, []],
      ]),
      new Set(['src/_apis', 'src/_types'])
    );
    expect(
      result.map((item) => [
        item.itemId,
        item.relationalQualifications.isParentCategory,
      ])
    ).toEqual([
      [1, true],
      [2, false],
      [3, true],
      [4, false],
    ]);
  });
});
