import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isPeerPair } from './index.js';

const makeClassification = (
  id: number,
  domainKind: null | TLogicalDomainKind,
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind,
  entryKind: domainKind === null ? 'file' : 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: id,
  nodeKind,
  path: `item-${id}`,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

describe('isPeerPair', () => {
  it('returns true when both are categories', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, 'category', null)],
        [1, makeClassification(1, 'category', null)],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(true);
  });

  it('returns true when both are category nodes', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, null, 'category-node')],
        [1, makeClassification(1, null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(true);
  });

  it('returns false when both are root nodes', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, null, 'root-node')],
        [1, makeClassification(1, null, 'root-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });

  it('returns false when source is root node and destination is category node', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, null, 'root-node')],
        [1, makeClassification(1, null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });

  it('returns false when destination is root node and source is category node', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, null, 'category-node')],
        [1, makeClassification(1, null, 'root-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });

  it('returns false when destination is a fractal branch', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, 'category', null)],
        [1, makeClassification(1, 'fractal-branch', null)],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });

  it('returns true when source is a fractal branch and destination is category', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, 'fractal-branch', null)],
        [1, makeClassification(1, 'category', null)],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(true);
  });

  it('returns false when either step is a root fragment', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, 'root-fragment', null)],
        [1, makeClassification(1, 'category', null)],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });

  it('returns false when one is a domain and one is a node', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, 'category', null)],
        [1, makeClassification(1, null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });

  it('returns false when a node is unauthorized', () => {
    const taxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [0, makeClassification(0, null, 'unauthorized-logical-node')],
        [1, makeClassification(1, null, 'category-node')],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    expect(isPeerPair(0, 1, taxonomy)).toBe(false);
  });
});
