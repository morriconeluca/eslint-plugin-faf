import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { resolveChildType } from './index.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const makeItem = (
  entryKind: 'directory' | 'file',
  domainKind: null | TLogicalDomainKind,
  nodeKind: null | TNodeKind,
  isPrivateCategory = false
): TItemClassification => ({
  domainKind,
  entryKind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind,
  path: 'test',
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: absentRole,
});

describe('resolveChildType', () => {
  it('returns null for unclassified files and directories', () => {
    expect(
      resolveChildType(makeItem('file', null, null), 'root-layer')
    ).toBeNull();
    expect(
      resolveChildType(makeItem('directory', null, null), 'root-layer')
    ).toBeNull();
  });

  it('resolves fragment-node and master-node to fragment-node', () => {
    expect(
      resolveChildType(makeItem('file', null, 'fragment-node'), 'fragment')
    ).toBe('fragment-node');
    expect(
      resolveChildType(makeItem('file', null, 'master-node'), 'fragment')
    ).toBe('fragment-node');
  });

  it('preserves other explicit node kinds', () => {
    expect(
      resolveChildType(makeItem('file', null, 'access-node'), 'fragment')
    ).toBe('access-node');
    expect(
      resolveChildType(makeItem('file', null, 'foreign-node'), 'fragment')
    ).toBe('foreign-node');
  });

  it('maps unauthorized-logical-node contextually to Fragment or Category or preserves it', () => {
    expect(
      resolveChildType(
        makeItem('file', null, 'unauthorized-logical-node'),
        'fragment'
      )
    ).toBe('fragment-node');
    expect(
      resolveChildType(
        makeItem('file', null, 'unauthorized-logical-node'),
        'category'
      )
    ).toBe('category-node');
    expect(
      resolveChildType(
        makeItem('file', null, 'unauthorized-logical-node'),
        'root-layer'
      )
    ).toBe('unauthorized-logical-node');
  });

  it('distinguishes private categories from ordinary categories and preserves other domains', () => {
    expect(
      resolveChildType(
        makeItem('directory', 'category', null, true),
        'fragment'
      )
    ).toBe('private-category');
    expect(
      resolveChildType(
        makeItem('directory', 'category', null, false),
        'root-layer'
      )
    ).toBe('category');
    expect(
      resolveChildType(
        makeItem('directory', 'layer', null, false),
        'root-layer'
      )
    ).toBe('layer');
  });
});
