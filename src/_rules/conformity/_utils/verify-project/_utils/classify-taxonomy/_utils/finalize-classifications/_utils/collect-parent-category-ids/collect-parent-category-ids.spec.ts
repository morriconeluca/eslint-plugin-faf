import { describe, expect, it } from 'vitest';

import type { TClassificationDraft } from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { collectParentCategoryIds } from './collect-parent-category-ids.util.js';

const draft = (
  itemId: number,
  domainKind: TClassificationDraft['domainKind'],
  path: string,
  form: TClassificationDraft['form'] = 'fragments'
): TClassificationDraft => ({
  domainKind,
  entryKind: 'directory',
  form,
  fragmentInternalRank: null,
  imposedRoleName: null,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  itemId,
  nodeKind: null,
  parentFragmentPath: null,
  path,
  role: { kind: 'absent', roleName: null },
});

describe('collectParentCategoryIds', () => {
  it('marks a fragments category that has a sub-category child', () => {
    const ids = collectParentCategoryIds(
      new Map([
        [1, draft(1, 'category', 'src/_components')],
        [2, draft(2, 'sub-category', 'src/_components/_atoms')],
      ]),
      new Map([[1, [2]]]),
      new Set()
    );
    expect(ids.has(1)).toBe(true);
  });

  it('marks a mimetic fragments category without sub-category children', () => {
    const ids = collectParentCategoryIds(
      new Map([[1, draft(1, 'category', 'src/_apis')]]),
      new Map([[1, []]]),
      new Set(['src/_apis'])
    );
    expect([...ids]).toEqual([1]);
  });

  it('does not mark a category of category nodes or a category without either signal', () => {
    const ids = collectParentCategoryIds(
      new Map([
        [1, draft(1, 'category', 'src/_types', 'category-nodes')],
        [2, draft(2, 'category', 'src/_hooks')],
        [3, draft(3, 'layer', 'src/_domain')],
      ]),
      new Map([
        [1, [4]],
        [2, [5]],
      ]),
      new Set(['src/_types'])
    );
    expect(ids.size).toBe(0);
  });

  it('marks a category when only one child is a sub-category', () => {
    const ids = collectParentCategoryIds(
      new Map([
        [1, draft(1, 'category', 'src/_components')],
        [2, draft(2, 'sub-category', 'src/_components/_atoms')],
        [3, draft(3, 'fragment', 'src/_components/button')],
      ]),
      new Map([[1, [2, 3]]]),
      new Set()
    );
    expect([...ids]).toEqual([1]);
  });

  it('does not mark a non-category that contains a sub-category child', () => {
    const ids = collectParentCategoryIds(
      new Map([
        [1, draft(1, 'layer', 'src/_domain')],
        [2, draft(2, 'sub-category', 'src/_domain/_types')],
      ]),
      new Map([[1, [2]]]),
      new Set()
    );
    expect(ids.size).toBe(0);
  });

  it('ignores a missing child draft', () => {
    const ids = collectParentCategoryIds(
      new Map([[1, draft(1, 'category', 'src/_components')]]),
      new Map([[1, [9]]]),
      new Set()
    );
    expect(ids.size).toBe(0);
  });
});
