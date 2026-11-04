import { describe, expect, it } from 'vitest';

import type { TClassificationDraft } from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { collectMasterIds } from './collect-master-ids.util.js';

const fileDraft = (
  itemId: number,
  nodeKind: TClassificationDraft['nodeKind'],
  roleName: null | string,
  kind: 'absent' | 'explicit' | 'implicit' = 'explicit'
): TClassificationDraft => ({
  domainKind: null,
  entryKind: 'file',
  form: null,
  fragmentInternalRank: 1,
  imposedRoleName: 'component',
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  itemId,
  nodeKind,
  parentFragmentPath: 'src/button',
  path: `src/button/${itemId}.ts`,
  role: { kind, roleName },
});

describe('collectMasterIds', () => {
  it('selects the single explicit fragment node with the imposed role', () => {
    const ids = collectMasterIds(
      new Map([
        [
          1,
          {
            ...fileDraft(1, null, null, 'absent'),
            domainKind: 'fragment',
            entryKind: 'directory',
            imposedRoleName: 'component',
            path: 'src/button',
          },
        ],
        [2, fileDraft(2, 'fragment-node', 'component')],
        [3, fileDraft(3, 'fragment-node', 'hook')],
      ]),
      new Map([[1, [2, 3]]])
    );
    expect([...ids]).toEqual([2]);
  });

  it('selects none when the imposed role is duplicated or absent', () => {
    const fragment = {
      ...fileDraft(1, null, null, 'absent'),
      domainKind: 'fragment' as const,
      entryKind: 'directory' as const,
      imposedRoleName: 'component',
      path: 'src/button',
    };
    const duplicated = collectMasterIds(
      new Map([
        [1, fragment],
        [2, fileDraft(2, 'fragment-node', 'component')],
        [3, fileDraft(3, 'fragment-node', 'component')],
      ]),
      new Map([[1, [2, 3]]])
    );
    const missing = collectMasterIds(
      new Map([
        [1, fragment],
        [2, fileDraft(2, 'access-node', null, 'absent')],
      ]),
      new Map([[1, [2, 9]]])
    );
    expect(duplicated.size).toBe(0);
    expect(missing.size).toBe(0);
  });

  it('ignores a non-fragment directory, an implicit role, a non-fragment node, and a missing child list', () => {
    const category = {
      ...fileDraft(1, null, 'component'),
      domainKind: 'category' as const,
      entryKind: 'directory' as const,
      path: 'src/_components',
    };
    const fromCategory = collectMasterIds(
      new Map([
        [1, category],
        [2, fileDraft(2, 'fragment-node', 'component')],
      ]),
      new Map([[1, [2]]])
    );
    const implicit = collectMasterIds(
      new Map([
        [
          1,
          {
            ...fileDraft(1, null, null, 'absent'),
            domainKind: 'fragment' as const,
            entryKind: 'directory' as const,
            imposedRoleName: 'component',
            path: 'src/button',
          },
        ],
        [2, fileDraft(2, 'fragment-node', 'component', 'implicit')],
        [3, fileDraft(3, 'category-node', 'component')],
      ]),
      new Map([[1, [2, 3]]])
    );
    const missingChildren = collectMasterIds(
      new Map([
        [
          4,
          {
            ...fileDraft(4, null, null, 'absent'),
            domainKind: 'fragment' as const,
            entryKind: 'directory' as const,
            imposedRoleName: 'component',
            path: 'src/card',
          },
        ],
      ]),
      new Map()
    );
    expect(fromCategory.size).toBe(0);
    expect(implicit.size).toBe(0);
    expect(missingChildren.size).toBe(0);
  });
});
